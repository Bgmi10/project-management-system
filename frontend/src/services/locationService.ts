import axios from 'axios';
import { Location } from '../types';
import { calculateDistance } from '../utils/distance';

const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;
const MAPBOX_API = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

// Add rate limiting
const RATE_LIMIT_MS = 100; // 10 requests per second (Mapbox allows more)
let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

export async function getCoordinates(city: string, state: string): Promise<[number, number]> {
  try {
    await rateLimit();

    const query = `${city}, ${state}, United States`;
    const response = await axios.get(`${MAPBOX_API}/${encodeURIComponent(query)}.json`, {
      params: {
        access_token: MAPBOX_API_KEY,
        types: 'place',
        country: 'US',
        limit: 1
      }
    });

    if (!response.data.features?.length) {
      throw new Error(`Location not found for ${city}, ${state}`);
    }

    const [lon, lat] = response.data.features[0].center;
    return [lat, lon];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please try again in a few minutes.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      }
    }
    throw new Error(`Failed to get coordinates for ${city}, ${state}. Please verify the location.`);
  }
}

export async function findNearbyLocations(
  centerLat: number,
  centerLon: number,
  radiusMiles: number
): Promise<Location[]> {
  try {
    await rateLimit();

    // Convert radius to degrees (approximate)
    const milesPerDegree = 69;
    const searchRadius = radiusMiles / milesPerDegree;

    const bbox = [
      centerLon - searchRadius,
      centerLat - searchRadius,
      centerLon + searchRadius,
      centerLat + searchRadius
    ].join(',');

    const response = await axios.get(`${MAPBOX_API}/${centerLon},${centerLat}.json`, {
      params: {
        access_token: MAPBOX_API_KEY,
        types: 'place',
        country: 'US',
        limit: 50,
        bbox
      }
    });

    const locations: Location[] = [];
    const seen = new Set<string>();

    for (const feature of response.data.features) {
      try {
        const [lon, lat] = feature.center;
        const context = feature.context || [];
        
        // Find state from context
        const stateObj = context.find((c: any) => c.id.startsWith('region'));
        if (!stateObj) continue;

        const city = feature.text;
        const state = stateObj.text;
        const stateCode = stateObj.short_code?.replace('US-', '');

        if (!city || !stateCode) continue;

        // Skip if we've already seen this city/state combo
        const key = `${city}-${stateCode}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const distance = calculateDistance(centerLat, centerLon, lat, lon);
        if (distance <= radiusMiles) {
          locations.push({
            city,
            state: stateCode,
            latitude: lat,
            longitude: lon,
            distance,
            population: feature.properties?.population
          });
        }
      } catch (error) {
        console.warn('Error processing location:', error);
        continue;
      }
    }

    return locations.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please try again in a few minutes.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      }
    }
    throw new Error('Failed to find nearby locations. Please try again.');
  }
}
export interface Location {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distance: number;
  population?: number;
}

export interface PagePreview {
  title: string;
  url: string;
  location: Location;
  business?: {
    description: string;
    services: string;
    targetAudience: string;
    uniqueValue: string;
    coreValues: string;
  };
  images?: {
    hero: string;
    feature1: string;
    feature2: string;
    feature3: string;
  };
  logoUrl?: string;
  seo?: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
}

export interface FormData {
  domain: string;
  keyword: string;
  city: string;
  state: string;
  distance: number;
  maxPages: number;
  logoUrl: string;
  images: {
    hero: string;
    feature1: string;
    feature2: string;
    feature3: string;
  };
  business: {
    description: string;
    services: string;
    targetAudience: string;
    uniqueValue: string;
    coreValues: string;
  };
  suggestedLocations?: Array<{
    city: string;
    state: string;
  }>;
}
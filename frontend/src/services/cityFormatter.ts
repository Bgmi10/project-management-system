import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function formatCityName(city: string, state: string): Promise<{ city: string; state: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a location data specialist. Format city names according to official USPS standards."
        },
        {
          role: "user",
          content: `Format this city name and state according to official standards:
            City: ${city}
            State: ${state}
            
            Return as JSON with proper capitalization and formatting.
            Example: {"city": "New York", "state": "NY"}`
        }
      ],
      temperature: 0,
      max_tokens: 100
    });

    const formattedLocation = JSON.parse(response.choices[0].message.content || '{}');
    return {
      city: formattedLocation.city || city,
      state: formattedLocation.state || state
    };
  } catch (error) {
    console.error('Error formatting city name:', error);
    // Return original values if formatting fails
    return { city, state };
  }
}

export async function validateLocation(city: string, state: string): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a location data validator. Verify if a city exists in the given US state."
        },
        {
          role: "user",
          content: `Verify if this city exists in the given state:
            City: ${city}
            State: ${state}
            
            Return only true or false as a JSON boolean.`
        }
      ],
      temperature: 0,
      max_tokens: 50
    });

    return JSON.parse(response.choices[0].message.content || 'false');
  } catch (error) {
    console.error('Error validating location:', error);
    return true; // Default to true on error to not block the flow
  }
}
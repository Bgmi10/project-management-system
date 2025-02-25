import OpenAI from 'openai';
import { FormData } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateBusinessContent(url: string): Promise<Partial<FormData>> {
  try {
    // Default content for medical equipment rental
    const defaultContent = {
      description: "Premier medical equipment rental service specializing in vitrectomy recovery equipment. We provide high-quality, sanitized medical equipment delivered right to your door, ensuring comfort and proper healing during your recovery period.",
      services: "Vitrectomy Recovery Chair Rental\nFace-Down Support Cushions & Pillows\nAdjustable Face-Down Mirrors\nComplete Recovery Kits\nDelivery & Setup Support\nNationwide Rental Service",
      targetAudience: "Post-surgery patients, particularly those recovering from eye surgery, and their caregivers. Healthcare facilities and medical professionals seeking reliable equipment rental solutions for their patients.",
      uniqueValue: "24/7 delivery and support with expertly sanitized medical equipment. We ensure your recovery is comfortable and effective with premium equipment and professional setup.",
      coreValues: "Patient Comfort First\nMedical-Grade Sanitization\n24/7 Professional Support\nReliable & Timely Service\nCompassionate Care\nQuality Equipment Guaranteed",
      keyword: "Vitrectomy Recovery Equipment Rental",
      suggestedLocations: [
        { city: "New York", state: "NY" },
        { city: "Los Angeles", state: "CA" },
        { city: "Chicago", state: "IL" }
      ]
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert content strategist and copywriter specializing in medical equipment rental services.
          Your writing style is professional, empathetic, and focused on patient care and recovery.`
        },
        {
          role: "user",
          content: `Analyze the medical equipment rental website ${url} and generate optimized business content. Include:
            1. A compelling business description (3-4 sentences) focused on vitrectomy recovery equipment
            2. 5-7 key medical equipment rental services (one per line)
            3. Target audience description focusing on post-surgery patients and healthcare providers
            4. Unique value proposition emphasizing equipment quality and patient support
            5. 5-7 core values centered on patient care and medical standards
            6. Primary keyword for medical equipment rental SEO
            7. Suggest 3 major medical hub locations
            
            Format the response as JSON with keys: description, services, targetAudience, uniqueValue, coreValues, keyword, suggestedLocations`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    });

    let content;
    try {
      content = JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.warn('Failed to parse OpenAI response, using default content');
      content = defaultContent;
    }

    // Merge with default content for any missing fields
    return {
      business: {
        description: content.description || defaultContent.description,
        services: content.services || defaultContent.services,
        targetAudience: content.targetAudience || defaultContent.targetAudience,
        uniqueValue: content.uniqueValue || defaultContent.uniqueValue,
        coreValues: content.coreValues || defaultContent.coreValues
      },
      keyword: content.keyword || defaultContent.keyword,
      suggestedLocations: content.suggestedLocations || defaultContent.suggestedLocations
    };
  } catch (error) {
    console.error('Error generating content:', error);
    // Return default content as fallback
    return {
      business: {
        description: defaultContent.description,
        services: defaultContent.services,
        targetAudience: defaultContent.targetAudience,
        uniqueValue: defaultContent.uniqueValue,
        coreValues: defaultContent.coreValues
      },
      keyword: defaultContent.keyword,
      suggestedLocations: defaultContent.suggestedLocations
    };
  }
}

export async function generateSEOMetadata(title: string, description: string): Promise<{
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert specializing in medical equipment rental services."
        },
        {
          role: "user",
          content: `Generate SEO metadata for a medical equipment rental landing page with:
            Title: ${title}
            Description: ${description}
            
            Include:
            1. SEO-optimized meta title (max 60 chars)
            2. Compelling meta description (max 155 chars)
            3. 5-7 relevant medical equipment keywords
            
            Format as JSON with keys: metaTitle, metaDescription, keywords`
        }
      ],
      temperature: 0.5,
      max_tokens: 500
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    // Return default metadata
    return {
      metaTitle: title,
      metaDescription: description.slice(0, 155),
      keywords: ['medical equipment rental', 'vitrectomy recovery', 'medical supplies']
    };
  }
}
export function isValidDomain(domain: string): boolean {
  // Remove protocol and www if present
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  // Basic domain validation regex
  const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
  
  return domainRegex.test(cleanDomain);
}

export function cleanDomain(url: string): string {
  // Remove protocol and www
  return url.replace(/^(https?:\/\/)?(www\.)?/, '')
    .toLowerCase()
    .trim()
    .replace(/\/$/, ''); // Remove trailing slash
}

export function generateSeoUrl(domain: string, keyword: string, city: string, state: string): string {
  const cleanedDomain = cleanDomain(domain);
  
  if (!isValidDomain(cleanedDomain)) {
    throw new Error('Invalid domain format');
  }
  
  // Convert keyword, city and state to URL-friendly format
  const urlKeyword = keyword.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const urlCity = city.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const urlState = state.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `${cleanedDomain}/locations/${urlCity}-${urlState}/${urlKeyword}`;
}

export function generateMetaTitle(keyword: string, city: string, state: string): string {
  return `${keyword} in ${city}, ${state} | Professional Medical Equipment`;
}

export function generateMetaDescription(business: { description: string }): string {
  // Truncate description to 155 characters for meta description
  return business.description.length > 155
    ? business.description.substring(0, 152) + '...'
    : business.description;
}

export function extractKeywords(business: {
  keyword: string;
  city: string;
  state: string;
  description: string;
  services: string;
}): string[] {
  const keywords = new Set([
    business.keyword,
    `${business.keyword} ${business.city}`,
    `${business.keyword} ${business.state}`,
    `${business.keyword} near me`,
    'medical equipment rental',
    'vitrectomy recovery equipment',
    'post surgery equipment',
    ...business.services.split('\n').map(service => service.trim()),
  ]);
  
  return Array.from(keywords);
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Globe, Eye, Download, MapPin, ArrowRight, Sparkles, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSavedPages } from '../hooks/useSavedPages';
import { getCoordinates, findNearbyLocations } from '../services/locationService';
import { generateBusinessContent } from '../services/openai';
import { FormData, PagePreview } from '../types';
import { generateSeoUrl, isValidDomain, cleanDomain } from '../utils/seo';
import { generateLandingPage } from '../utils/pageGenerator';
import { PreviewModal } from './PreviewModal';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function LandingPageGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savePage } = useSavedPages();
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  
  // Location settings
  const [city, setCity] = useState('New York');
  const [state, setState] = useState('NY');
  const [radius, setRadius] = useState(25);
  const [maxPages, setMaxPages] = useState(10);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError('');
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setRadius(Math.min(Math.max(1, value), 100));
    }
  };

  const handleMaxPagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setMaxPages(Math.min(Math.max(1, value), 50));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL
    if (!url.trim()) {
      setUrlError('Please enter a website URL');
      return;
    }

    const cleanedUrl = cleanDomain(url);
    if (!isValidDomain(cleanedUrl)) {
      setUrlError('Please enter a valid domain (e.g., example.com)');
      return;
    }

    setIsGenerating(true);
    setUrlError('');

    try {
      // Step 1: Get coordinates for the target city
      let coordinates: [number, number];
      try {
        coordinates = await getCoordinates(city, state);
      } catch (error) {
        throw new Error(`Could not find coordinates for ${city}, ${state}. Please verify the location.`);
      }

      // Step 2: Find nearby locations
      let nearbyLocations;
      try {
        nearbyLocations = await findNearbyLocations(coordinates[0], coordinates[1], radius);
      } catch (error) {
        throw new Error(`Could not find nearby locations. Please try a different location or increase the radius.`);
      }

      if (!nearbyLocations.length) {
        throw new Error(`No locations found within ${radius} miles of ${city}, ${state}. Try increasing the radius.`);
      }

      // Step 3: Generate business content
      let generatedContent;
      try {
        generatedContent = await generateBusinessContent(cleanedUrl);
      } catch (error) {
        console.error('Content generation error:', error);
        throw new Error('Failed to generate content. Please try again.');
      }

      // Step 4: Create form data
      const formData: FormData = {
        domain: cleanedUrl,
        keyword: generatedContent.keyword || "Medical Equipment Rental",
        city,
        state,
        distance: radius,
        maxPages,
        logoUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1000&auto=format&fit=crop",
        images: {
          hero: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop",
          feature1: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1000&auto=format&fit=crop",
          feature2: "https://images.unsplash.com/photo-1497366754035-5f381699c2dd?q=80&w=1000&auto=format&fit=crop",
          feature3: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1000&auto=format&fit=crop"
        },
        business: generatedContent.business || {
          description: "Premier medical equipment rental service specializing in post-surgery recovery equipment. We provide high-quality, sanitized medical equipment delivered right to your door.",
          services: "Medical Equipment Rental\nPost-Surgery Recovery Equipment\nHome Care Equipment\nMedical Supply Delivery",
          targetAudience: "Post-surgery patients and healthcare providers seeking reliable medical equipment solutions",
          uniqueValue: "24/7 delivery and support with expertly sanitized medical equipment",
          coreValues: "Patient Care\nQuality Equipment\nReliable Service\nProfessional Support"
        }
      };

      // Step 5: Generate preview for the first location
      const location = nearbyLocations[0];
      const pagePreview: PagePreview = {
        title: `${formData.keyword} in ${location.city}, ${location.state}`,
        url: generateSeoUrl(formData.domain, formData.keyword, location.city, location.state),
        location,
        business: formData.business,
        images: formData.images,
        logoUrl: formData.logoUrl
      };

      // Generate HTML preview
      const html = generateLandingPage(pagePreview, formData);
      setPreview(html);
      setIsPreviewOpen(true);

      // Save if user is logged in
      if (user) {
        try {
          await savePage(formData, [pagePreview]);
          toast.success('Landing page saved successfully!');
        } catch (error) {
          console.error('Save error:', error);
          toast.error('Failed to save the landing page, but preview is available');
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Generation error:', error);
      toast.error(errorMessage);
      setUrlError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-teal-100/40 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 rounded-full text-emerald-800 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Landing Page Generator
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Transform Any Website into a Beautiful Landing Page
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Enter a website URL and our AI will create a stunning, conversion-optimized landing page with custom content.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-emerald-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg text-lg bg-white/50 focus:ring-2 focus:ring-offset-2 transition-colors ${
                      urlError 
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                    placeholder="example.com"
                    required
                  />
                </div>
                {urlError && (
                  <div className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {urlError}
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Enter the website URL you want to analyze (e.g., example.com)
                </p>
              </div>

              {/* Location Settings */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowLocationSettings(!showLocationSettings)}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
                    Location Settings
                  </span>
                  <ChevronDown className={`w-5 h-5 transform transition-transform ${showLocationSettings ? 'rotate-180' : ''}`} />
                </button>
                
                {showLocationSettings && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      >
                        {US_STATES.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Radius (miles)
                      </label>
                      <input
                        type="number"
                        value={radius}
                        onChange={handleRadiusChange}
                        min="1"
                        max="100"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Maximum distance from city center (1-100 miles)
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Pages
                      </label>
                      <input
                        type="number"
                        value={maxPages}
                        onChange={handleMaxPagesChange}
                        min="1"
                        max="50"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Number of pages to generate (1-50)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Landing Page
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* How to Use */}
          <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-emerald-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h2>
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-sm font-medium mr-3">
                  1
                </span>
                <div>
                  <p className="text-gray-700">Enter your domain (e.g., <code className="bg-gray-100 px-2 py-0.5 rounded text-emerald-600">vitrectomymedical.com</code>)</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-sm font-medium mr-3">
                  2
                </span>
                <div>
                  <p className="text-gray-700">Click "Location Settings" to expand the options</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-sm font-medium mr-3">
                  3
                </span>
                <div>
                  <p className="text-gray-700">Set your desired city, state, radius, and max pages</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600">
                    <li>• City & State: Your main service location</li>
                    <li>• Radius: Distance to search for nearby cities (1-100 miles)</li>
                    <li>• Max Pages: Number of location pages to generate (1-50)</li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-sm font-medium mr-3">
                  4
                </span>
                <div>
                  <p className="text-gray-700">Click "Generate Landing Page" and preview your results</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-emerald-100 transform transition-all duration-200 hover:scale-105">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg p-3 inline-block mb-4">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">AI-Powered Content</h3>
              <p className="mt-2 text-gray-600">Custom content generated by GPT-4 for your business</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-emerald-100 transform transition-all duration-200 hover:scale-105">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg p-3 inline-block mb-4">
                <Eye className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              <p className="mt-2 text-gray-600">See your landing page instantly with our live preview</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-emerald-100 transform transition-all duration-200 hover:scale-105">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg p-3 inline-block mb-4">
                <Download className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Easy Export</h3>
              <p className="mt-2 text-gray-600">Download your landing page as HTML ready to use</p>
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <PreviewModal
          pages={[preview]}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreview(null);
          }}
        />
      )}
    </div>
  );
}
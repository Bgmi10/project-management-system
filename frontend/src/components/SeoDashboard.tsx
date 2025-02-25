import React, { useState } from 'react';
import { useSeoMetrics } from '../hooks/useSeoMetrics';
import { SeoMetricsChart } from './SeoMetricsChart';
import { LandingPageGenerator } from './LandingPageGenerator';
import { PagePreview } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Search,
  MapPin,
  BarChart2,
  ArrowUp,
  ArrowDown,
  Globe,
  Target,
  Clock,
  Link as LinkIcon,
  Filter,
  Plus,
  X
} from 'lucide-react';

interface DashboardProps {
  pageId: string;
}

export function SeoDashboard({ pageId }: DashboardProps) {
  const { metrics, loading, error } = useSeoMetrics(pageId);
  const [selectedMetrics, setSelectedMetrics] = useState(['organic_traffic', 'avg_position']);
  const [timeRange, setTimeRange] = useState('30d');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatedPages, setGeneratedPages] = useState<PagePreview[]>([]);

  const handlePagesGenerated = (pages: PagePreview[]) => {
    setGeneratedPages(pages);
    setIsGeneratorOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-red-500">
        {error || 'Failed to load metrics'}
      </div>
    );
  }

  const stats = [
    {
      label: 'Performance Score',
      value: metrics.performance_score,
      icon: BarChart2,
      change: '+5',
      isPositive: true
    },
    {
      label: 'Organic Traffic',
      value: metrics.organic_traffic.toLocaleString(),
      icon: Globe,
      change: '+12%',
      isPositive: true
    },
    {
      label: 'Avg. Position',
      value: '3.2',
      icon: Target,
      change: '-0.5',
      isPositive: true
    },
    {
      label: 'Time on Page',
      value: '2:45',
      icon: Clock,
      change: '+15%',
      isPositive: true
    },
    {
      label: 'Internal Links',
      value: metrics.internal_links,
      icon: LinkIcon,
      change: '+3',
      isPositive: true
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">SEO Performance</h2>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border-gray-300 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button 
            onClick={() => setIsGeneratorOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Pages
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Page Generator Modal */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <div className="fixed inset-0" onClick={() => setIsGeneratorOpen(false)} />
            <div className="inline-block w-full max-w-7xl my-8 text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setIsGeneratorOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <LandingPageGenerator onPagesGenerated={handlePagesGenerated} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recently Generated Pages */}
      {generatedPages.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Generated Pages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedPages.map((page, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <h4 className="font-medium text-gray-900">{page.title}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Distance: {page.location.distance.toFixed(1)} miles
                </p>
                <div className="mt-2 text-sm">
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    View Page →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <stat.icon className="w-5 h-5 text-gray-400" />
              <span className={`text-sm font-medium ${
                stat.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
                {stat.isPositive ? (
                  <ArrowUp className="w-4 h-4 inline ml-1" />
                ) : (
                  <ArrowDown className="w-4 h-4 inline ml-1" />
                )}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
          <div className="flex items-center space-x-2">
            {['organic_traffic', 'bounce_rate', 'avg_position', 'conversions'].map((metric) => (
              <label key={metric} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes(metric)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMetrics([...selectedMetrics, metric]);
                    } else {
                      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
                    }
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  {metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </label>
            ))}
          </div>
        </div>
        <SeoMetricsChart
          data={metrics.history}
          metrics={selectedMetrics}
        />
      </div>

      {/* Keywords and Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Rankings</h3>
          <div className="space-y-4">
            {metrics.keywords.map((keyword, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{keyword.keyword}</div>
                  <div className="text-sm text-gray-500">
                    Volume: {keyword.search_volume.toLocaleString()} | 
                    Difficulty: {keyword.keyword_difficulty}%
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-semibold text-gray-900">
                    #{keyword.position}
                  </div>
                  {keyword.featured_snippet && (
                    <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Performance</h3>
          <div className="space-y-4">
            {metrics.locations.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {location.city}, {location.state}
                  </div>
                  <div className="text-sm text-gray-500">
                    Traffic: {location.local_traffic.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-gray-500">
                    Market Share: {location.market_share}%
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    #{location.local_ranking}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface PageMetrics {
  id: string;
  url: string;
  title: string;
  performance_score: number;
  organic_traffic: number;
  bounce_rate: number;
  avg_time_on_page: string;
  internal_links: number;
  keywords: Array<{
    keyword: string;
    position: number;
    search_volume: number;
    keyword_difficulty: number;
    featured_snippet: boolean;
  }>;
  locations: Array<{
    city: string;
    state: string;
    local_ranking: number;
    local_traffic: number;
    market_share: number;
  }>;
  history: Array<{
    date: string;
    organic_traffic: number;
    bounce_rate: number;
    avg_position: number;
    conversions: number;
  }>;
}

export function useSeoMetrics(pageId?: string) {
  const [metrics, setMetrics] = useState<PageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    const loadMetrics = async () => {
      try {
        // Load page metrics
        const { data: pageData, error: pageError } = await supabase
          .from('page_metrics')
          .select('*')
          .eq('id', pageId)
          .single();

        if (pageError) throw pageError;

        // Load keywords
        const { data: keywordData, error: keywordError } = await supabase
          .from('keyword_rankings')
          .select('*')
          .eq('page_id', pageId);

        if (keywordError) throw keywordError;

        // Load location metrics
        const { data: locationData, error: locationError } = await supabase
          .from('location_metrics')
          .select('*')
          .eq('page_id', pageId);

        if (locationError) throw locationError;

        // Load performance history
        const { data: historyData, error: historyError } = await supabase
          .from('performance_history')
          .select('*')
          .eq('page_id', pageId)
          .order('date', { ascending: false });

        if (historyError) throw historyError;

        setMetrics({
          ...pageData,
          keywords: keywordData,
          locations: locationData,
          history: historyData
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load SEO metrics';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [pageId]);

  const updateMetrics = async (updates: Partial<PageMetrics>) => {
    if (!pageId) return;

    try {
      const { error } = await supabase
        .from('page_metrics')
        .update(updates)
        .eq('id', pageId);

      if (error) throw error;

      setMetrics(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Metrics updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update metrics';
      toast.error(message);
      throw err;
    }
  };

  return {
    metrics,
    loading,
    error,
    updateMetrics
  };
}
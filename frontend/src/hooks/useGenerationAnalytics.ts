import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface GenerationAnalytics {
  totalPages: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  averageDaily: number;
  successRate: number;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  timeDistribution: Array<{
    date: string;
    count: number;
  }>;
}

export function useGenerationAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<GenerationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    const loadAnalytics = async () => {
      try {
        // Get total pages
        const { count: totalPages } = await supabase
          .from('page_generation_analytics')
          .select('pages_count', { count: 'exact' })
          .eq('user_id', user.id);

        // Get recent generations
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: recentData } = await supabase
          .from('page_generation_analytics')
          .select('pages_count, created_at, status')
          .eq('user_id', user.id)
          .gte('created_at', last30Days);

        const last24HoursCount = recentData?.filter(d => 
          new Date(d.created_at) >= new Date(last24Hours)
        ).reduce((sum, d) => sum + d.pages_count, 0) || 0;

        const last7DaysCount = recentData?.filter(d => 
          new Date(d.created_at) >= new Date(last7Days)
        ).reduce((sum, d) => sum + d.pages_count, 0) || 0;

        const last30DaysCount = recentData?.reduce((sum, d) => sum + d.pages_count, 0) || 0;

        // Calculate success rate
        const successCount = recentData?.filter(d => d.status === 'success').length || 0;
        const successRate = recentData?.length ? (successCount / recentData.length) * 100 : 0;

        // Get top keywords
        const { data: keywordData } = await supabase
          .from('page_generation_analytics')
          .select('keyword, pages_count')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        const keywordCounts = keywordData?.reduce((acc, curr) => {
          acc[curr.keyword] = (acc[curr.keyword] || 0) + curr.pages_count;
          return acc;
        }, {} as Record<string, number>);

        const topKeywords = Object.entries(keywordCounts || {})
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([keyword, count]) => ({ keyword, count }));

        // Calculate peak hours
        const hourCounts = recentData?.reduce((acc, curr) => {
          const hour = new Date(curr.created_at).getHours();
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        const peakHours = Object.entries(hourCounts || {})
          .map(([hour, count]) => ({ hour: parseInt(hour), count }))
          .sort((a, b) => b.count - a.count);

        // Calculate time distribution
        const timeDistribution = recentData?.reduce((acc, curr) => {
          const date = new Date(curr.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + curr.pages_count;
          return acc;
        }, {} as Record<string, number>);

        const timeDistributionArray = Object.entries(timeDistribution || {})
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setAnalytics({
          totalPages: totalPages || 0,
          last24Hours: last24HoursCount,
          last7Days: last7DaysCount,
          last30Days: last30DaysCount,
          averageDaily: last30DaysCount / 30,
          successRate,
          topKeywords,
          peakHours,
          timeDistribution: timeDistributionArray
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user]);

  const trackGeneration = async (
    pagesCount: number,
    keyword: string,
    location: { city: string; state: string },
    generationTime: number,
    status: 'success' | 'error'
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('page_generation_analytics')
        .insert({
          user_id: user.id,
          pages_count: pagesCount,
          keyword,
          location,
          status,
          generation_time: `${generationTime} milliseconds`
        });
    } catch (err) {
      console.error('Failed to track generation:', err);
    }
  };

  return {
    analytics,
    loading,
    error,
    trackGeneration
  };
}
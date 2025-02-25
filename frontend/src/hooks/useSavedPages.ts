import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { FormData, PagePreview } from '../types';

interface SavedPageData {
  id: string;
  form_data: FormData;
  previews: PagePreview[];
  created_at: Date;
}

export function useSavedPages() {
  const { user } = useAuth();
  const [savedPages, setSavedPages] = useState<SavedPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSavedPages([]);
      setLoading(false);
      return;
    }

    const loadSavedPages = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_pages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setSavedPages(data.map(page => ({
          ...page,
          created_at: new Date(page.created_at)
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load saved pages');
      } finally {
        setLoading(false);
      }
    };

    loadSavedPages();
  }, [user]);

  const savePage = async (formData: FormData, previews: PagePreview[]) => {
    if (!user) {
      throw new Error('Must be logged in to save pages');
    }

    try {
      const { data, error } = await supabase
        .from('saved_pages')
        .insert({
          user_id: user.id,
          form_data: formData,
          previews: previews
        })
        .select()
        .single();

      if (error) throw error;

      const newSavedPage: SavedPageData = {
        ...data,
        created_at: new Date(data.created_at)
      };

      setSavedPages(prev => [newSavedPage, ...prev]);
      return data.id;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save page');
    }
  };

  const deletePage = async (pageId: string) => {
    if (!user) {
      throw new Error('Must be logged in to delete pages');
    }

    try {
      const { error } = await supabase
        .from('saved_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      setSavedPages(prev => prev.filter(page => page.id !== pageId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete page');
    }
  };

  return {
    savedPages,
    loading,
    error,
    savePage,
    deletePage
  };
}
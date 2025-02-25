import React from 'react';
import { X, Trash2, Download, Eye } from 'lucide-react';
import { useSavedPages } from '../hooks/useSavedPages';
import { FormData, PagePreview } from '../types';

interface SavedPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (formData: FormData, previews: PagePreview[]) => void;
  onPreview: (pages: string[]) => void;
}

export function SavedPagesModal({ isOpen, onClose, onLoad, onPreview }: SavedPagesModalProps) {
  const { savedPages, loading, error, deletePage } = useSavedPages();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">Saved Landing Pages</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Loading saved pages...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : savedPages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No saved pages found. Generate some landing pages and save them to see them here.
            </div>
          ) : (
            <div className="space-y-4">
              {savedPages.map((page) => (
                <div
                  key={page.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">
                      {page.formData.keyword} in {page.formData.city}, {page.formData.state}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onPreview([page.previews[0].url])}
                        className="p-2 text-gray-600 hover:text-gray-900"
                        title="Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onLoad(page.formData, page.previews)}
                        className="p-2 text-blue-600 hover:text-blue-700"
                        title="Load"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deletePage(page.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Created {new Date(page.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {page.previews.length} pages generated
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
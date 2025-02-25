import React, { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface PreviewModalProps {
  pages: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function PreviewModal({ pages, isOpen, onClose }: PreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentPage(0); // Reset to first page when opening
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'ArrowUp') contentRef.current?.scrollBy(0, -100);
      if (e.key === 'ArrowDown') contentRef.current?.scrollBy(0, 100);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, currentPage, pages.length]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      setZoom(prevZoom => Math.min(Math.max(50, prevZoom + delta * 10), 200));
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prevZoom => {
      const newZoom = direction === 'in' ? prevZoom + 10 : prevZoom - 10;
      return Math.min(Math.max(50, newZoom), 200);
    });
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => (prev < pages.length - 1 ? prev + 1 : prev));
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      onClick={e => e.target === modalRef.current && onClose()}
    >
      <div className="relative w-full max-w-6xl h-[80vh] bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gray-100 rounded-t-lg flex items-center justify-between px-4">
          <div className="text-sm text-gray-600">
            Page {currentPage + 1} of {pages.length}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNextPage}
          disabled={currentPage === pages.length - 1}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Content */}
        <div
          ref={contentRef}
          className="h-full overflow-y-auto pt-12"
          onWheel={handleWheel}
        >
          <div
            className="transition-transform duration-200 px-6 py-4"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            dangerouslySetInnerHTML={{ __html: pages[currentPage] }}
          />
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 p-2 rounded-lg shadow-lg">
          <button
            onClick={() => handleZoom('out')}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={zoom <= 50}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium min-w-[3ch] text-center">{zoom}%</span>
          <button
            onClick={() => handleZoom('in')}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={zoom >= 200}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
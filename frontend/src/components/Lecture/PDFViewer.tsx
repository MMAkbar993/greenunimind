import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  AlertCircle,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  className?: string;
  enableDownload?: boolean;
  onProgress?: (page: number, totalPages: number) => void;
}

interface PDFState {
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  isLoading: boolean;
  error: string | null;
  isFullscreen: boolean;
  searchTerm: string;
  showSearch: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  title,
  className,
  enableDownload = false,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfState, setPdfState] = useState<PDFState>({
    currentPage: 1,
    totalPages: 1,
    scale: 1,
    rotation: 0,
    isLoading: true,
    error: null,
    isFullscreen: false,
    searchTerm: '',
    showSearch: false,
  });

  // Initialize PDF viewer
  useEffect(() => {
    if (!pdfUrl) {
      setPdfState(prev => ({
        ...prev,
        error: 'No PDF URL provided',
        isLoading: false,
      }));
      return;
    }

    setPdfState(prev => ({ ...prev, isLoading: true, error: null }));

    // Check if PDF is accessible
    fetch(pdfUrl, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          throw new Error('PDF not found or inaccessible');
        }
        setPdfState(prev => ({ ...prev, isLoading: false }));
      })
      .catch(error => {
        setPdfState(prev => ({
          ...prev,
          error: error.message || 'Failed to load PDF',
          isLoading: false,
        }));
      });
  }, [pdfUrl]);

  // Handle page navigation
  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, pdfState.totalPages));
    setPdfState(prev => ({ ...prev, currentPage: newPage }));
    
    if (onProgress) {
      onProgress(newPage, pdfState.totalPages);
    }
  };

  const nextPage = () => goToPage(pdfState.currentPage + 1);
  const prevPage = () => goToPage(pdfState.currentPage - 1);

  // Handle zoom
  const zoomIn = () => {
    setPdfState(prev => ({
      ...prev,
      scale: Math.min(prev.scale + 0.25, 3),
    }));
  };

  const zoomOut = () => {
    setPdfState(prev => ({
      ...prev,
      scale: Math.max(prev.scale - 0.25, 0.5),
    }));
  };

  const resetZoom = () => {
    setPdfState(prev => ({ ...prev, scale: 1 }));
  };

  // Handle rotation
  const rotate = () => {
    setPdfState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setPdfState(prev => ({ ...prev, isFullscreen: true }));
      });
    } else {
      document.exitFullscreen().then(() => {
        setPdfState(prev => ({ ...prev, isFullscreen: false }));
      });
    }
  };

  // Handle download
  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = title || 'document.pdf';
    link.click();
  };

  // Handle search
  const toggleSearch = () => {
    setPdfState(prev => ({
      ...prev,
      showSearch: !prev.showSearch,
      searchTerm: '',
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextPage();
          break;
        case 'Equal':
        case 'NumpadAdd':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case 'Minus':
        case 'NumpadSubtract':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case 'Digit0':
        case 'Numpad0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetZoom();
          }
          break;
        case 'KeyF':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleSearch();
          }
          break;
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pdfState.currentPage, pdfState.totalPages]);

  if (pdfState.error) {
    return (
      <div className={cn("relative bg-gray-100 rounded-lg overflow-hidden", className)}>
        <div className="flex items-center justify-center h-96 text-gray-600">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-lg font-semibold mb-2">PDF Error</h3>
              <p className="text-sm text-gray-500">{pdfState.error}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-white rounded-lg overflow-hidden border",
        className
      )}
      tabIndex={0}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900 truncate">{title}</span>
          <Badge variant="outline" className="ml-2">
            PDF
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSearch}
            className={cn(
              "text-gray-600 hover:text-gray-900",
              pdfState.showSearch && "bg-gray-200"
            )}
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              disabled={pdfState.scale <= 0.5}
              className="text-gray-600 hover:text-gray-900"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="px-2 text-sm font-mono text-gray-600 min-w-[4rem] text-center">
              {Math.round(pdfState.scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              disabled={pdfState.scale >= 3}
              className="text-gray-600 hover:text-gray-900"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Rotation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={rotate}
            className="text-gray-600 hover:text-gray-900"
          >
            <RotateCw className="w-4 h-4" />
          </Button>

          {/* Download */}
          {enableDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadPDF}
              className="text-gray-600 hover:text-gray-900"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-600 hover:text-gray-900"
          >
            {pdfState.isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {pdfState.showSearch && (
        <div className="p-4 border-b bg-yellow-50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search in document..."
                value={pdfState.searchTerm}
                onChange={(e) => setPdfState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-9"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSearch}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF Content */}
      <div className="relative flex-1">
        {pdfState.isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Loading PDF...</p>
            </div>
          </div>
        ) : (
          <div className="h-96 overflow-auto">
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}#page=${pdfState.currentPage}&zoom=${pdfState.scale * 100}&rotate=${pdfState.rotation}`}
              className="w-full h-full border-0"
              title={title}
              onLoad={() => {
                // Try to get total pages from PDF if possible
                // This is a simplified approach - in a real implementation,
                // you might use PDF.js for more control
                setPdfState(prev => ({ ...prev, isLoading: false }));
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevPage}
            disabled={pdfState.currentPage <= 1}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={pdfState.totalPages}
              value={pdfState.currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-16 text-center"
            />
            <span className="text-sm text-gray-600">
              of {pdfState.totalPages}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextPage}
            disabled={pdfState.currentPage >= pdfState.totalPages}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          Use arrow keys to navigate, Ctrl+/- to zoom
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

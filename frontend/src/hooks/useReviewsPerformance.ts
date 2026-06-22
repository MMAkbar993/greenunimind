import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { ReviewFilters, IReview } from '@/types/review';

interface UseReviewsPerformanceProps {
  reviews: IReview[];
  filters: ReviewFilters;
  onFiltersChange: (filters: Partial<ReviewFilters>) => void;
}

export const useReviewsPerformance = ({
  reviews,
  filters,
  onFiltersChange
}: UseReviewsPerformanceProps) => {
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');

  // Memoized filtered reviews to prevent unnecessary re-renders
  const filteredReviews = useMemo(() => {
    if (!reviews.length) return [];

    return reviews.filter(review => {
      // Search filter
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          review.comment.toLowerCase().includes(searchTerm) ||
          review.student.name.toLowerCase().includes(searchTerm) ||
          review.course.title.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Rating filter
      if (filters.rating?.length) {
        if (!filters.rating.includes(review.rating)) return false;
      }

      // Course filter
      if (filters.courseId) {
        if (review.course._id !== filters.courseId) return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const reviewDate = new Date(review.createdAt);
        
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          if (reviewDate < startDate) return false;
        }
        
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999); // End of day
          if (reviewDate > endDate) return false;
        }
      }

      return true;
    });
  }, [reviews, filters]);

  // Memoized sorted reviews
  const sortedReviews = useMemo(() => {
    if (!filteredReviews.length) return [];

    const sorted = [...filteredReviews];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'course':
          comparison = a.course.title.localeCompare(b.course.title);
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [filteredReviews, filters.sortBy, filters.sortOrder]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      if (searchTerm !== lastSearchRef.current) {
        lastSearchRef.current = searchTerm;
        onFiltersChange({ search: searchTerm, page: 1 });
      }
    }, 300),
    [onFiltersChange]
  );

  // Optimized search handler
  const handleSearchChange = useCallback((searchTerm: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Immediate UI update for responsiveness
    if (searchTerm === '') {
      onFiltersChange({ search: '', page: 1 });
      return;
    }

    // Debounced API call for non-empty searches
    debouncedSearch(searchTerm);
  }, [debouncedSearch, onFiltersChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedReviews = sortedReviews.slice(startIndex, endIndex);
    const totalPages = Math.ceil(sortedReviews.length / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      reviews: paginatedReviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews: sortedReviews.length,
        hasNextPage,
        hasPrevPage,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, sortedReviews.length)
      }
    };
  }, [sortedReviews, filters.page, filters.limit]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    return {
      totalReviews: reviews.length,
      filteredCount: filteredReviews.length,
      displayedCount: paginationData.reviews.length,
      filterEfficiency: reviews.length > 0 ? (filteredReviews.length / reviews.length) * 100 : 0
    };
  }, [reviews.length, filteredReviews.length, paginationData.reviews.length]);

  return {
    filteredReviews: paginationData.reviews,
    pagination: paginationData.pagination,
    handleSearchChange,
    performanceMetrics,
    // Utility functions
    isFiltered: useMemo(() => {
      return !!(
        filters.search ||
        filters.rating?.length ||
        filters.courseId ||
        filters.startDate ||
        filters.endDate
      );
    }, [filters]),
    
    isEmpty: paginationData.reviews.length === 0,
    
    // Accessibility helpers
    getAriaLabel: useCallback((type: 'results' | 'pagination') => {
      switch (type) {
        case 'results':
          return `Showing ${paginationData.pagination.startIndex} to ${paginationData.pagination.endIndex} of ${paginationData.pagination.totalReviews} reviews`;
        case 'pagination':
          return `Page ${paginationData.pagination.currentPage} of ${paginationData.pagination.totalPages}`;
        default:
          return '';
      }
    }, [paginationData.pagination])
  };
};

// Hook for virtual scrolling (for large datasets)
export const useVirtualScrolling = (
  itemHeight: number,
  containerHeight: number,
  items: any[]
) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const bufferSize = Math.min(5, Math.floor(visibleCount * 0.5));
  
  return useMemo(() => {
    const startIndex = 0; // This would be calculated based on scroll position
    const endIndex = Math.min(startIndex + visibleCount + bufferSize, items.length);
    
    return {
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, visibleCount, bufferSize]);
};

// Hook for lazy loading images
export const useLazyImage = (src: string, placeholder?: string) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.src = src;
    }
  }, [isInView, src]);

  return {
    ref: imgRef,
    src: isLoaded ? src : placeholder,
    isLoaded,
    isInView
  };
};

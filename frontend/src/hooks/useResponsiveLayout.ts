import { useState, useEffect } from 'react';

interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536,
};

export const useResponsiveLayout = (customBreakpoints?: Partial<BreakpointConfig>) => {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: false,
        width: 1024,
        height: 768,
        orientation: 'landscape',
        isTouch: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
      isDesktop: width >= breakpoints.tablet && width < breakpoints.wide,
      isWide: width >= breakpoints.wide,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait',
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState({
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
        isDesktop: width >= breakpoints.tablet && width < breakpoints.wide,
        isWide: width >= breakpoints.wide,
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait',
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      });
    };

    // Debounce resize events
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoints.mobile, breakpoints.tablet, breakpoints.desktop, breakpoints.wide]);

  // Helper functions
  const getGridColumns = (mobile: number, tablet: number, desktop: number, wide?: number) => {
    if (state.isMobile) return mobile;
    if (state.isTablet) return tablet;
    if (state.isDesktop) return desktop;
    return wide || desktop;
  };

  const getResponsiveValue = <T>(mobile: T, tablet?: T, desktop?: T, wide?: T): T => {
    if (state.isMobile) return mobile;
    if (state.isTablet) return tablet || mobile;
    if (state.isDesktop) return desktop || tablet || mobile;
    return wide || desktop || tablet || mobile;
  };

  const shouldShowMobileLayout = () => state.isMobile;
  const shouldShowTabletLayout = () => state.isTablet;
  const shouldShowDesktopLayout = () => state.isDesktop || state.isWide;
  const shouldUseTouchInteractions = () => state.isTouch;

  // Responsive classes helper
  const getResponsiveClasses = (classes: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    wide?: string;
    base?: string;
  }) => {
    const baseClasses = classes.base || '';
    
    if (state.isMobile && classes.mobile) {
      return `${baseClasses} ${classes.mobile}`.trim();
    }
    if (state.isTablet && classes.tablet) {
      return `${baseClasses} ${classes.tablet}`.trim();
    }
    if (state.isDesktop && classes.desktop) {
      return `${baseClasses} ${classes.desktop}`.trim();
    }
    if (state.isWide && classes.wide) {
      return `${baseClasses} ${classes.wide}`.trim();
    }
    
    return baseClasses;
  };

  // Container padding helper
  const getContainerPadding = () => {
    return getResponsiveValue(
      'px-4',    // mobile
      'px-6',    // tablet
      'px-8',    // desktop
      'px-12'    // wide
    );
  };

  // Grid gap helper
  const getGridGap = () => {
    return getResponsiveValue(
      'gap-4',   // mobile
      'gap-6',   // tablet
      'gap-6',   // desktop
      'gap-8'    // wide
    );
  };

  // Typography scale helper
  const getTypographyScale = () => {
    return {
      h1: getResponsiveValue('text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'),
      h2: getResponsiveValue('text-xl', 'text-2xl', 'text-3xl', 'text-4xl'),
      h3: getResponsiveValue('text-lg', 'text-xl', 'text-2xl', 'text-3xl'),
      h4: getResponsiveValue('text-base', 'text-lg', 'text-xl', 'text-2xl'),
      body: getResponsiveValue('text-sm', 'text-base', 'text-base', 'text-lg'),
      caption: getResponsiveValue('text-xs', 'text-sm', 'text-sm', 'text-base'),
    };
  };

  // Button size helper
  const getButtonSize = () => {
    return getResponsiveValue('sm', 'default', 'default', 'lg');
  };

  // Card padding helper
  const getCardPadding = () => {
    return getResponsiveValue('p-3', 'p-4', 'p-6', 'p-8');
  };

  // Table behavior helper
  const shouldUseCardLayout = () => state.isMobile;
  const shouldStackElements = () => state.isMobile;
  const shouldHideSecondaryActions = () => state.isMobile;

  // Touch interaction helpers
  const getTouchTargetSize = () => {
    return state.isTouch ? 'min-h-[44px] min-w-[44px]' : 'min-h-[32px] min-w-[32px]';
  };

  const getTouchSpacing = () => {
    return state.isTouch ? 'gap-3' : 'gap-2';
  };

  return {
    // State
    ...state,
    
    // Helpers
    getGridColumns,
    getResponsiveValue,
    getResponsiveClasses,
    getContainerPadding,
    getGridGap,
    getTypographyScale,
    getButtonSize,
    getCardPadding,
    getTouchTargetSize,
    getTouchSpacing,
    
    // Layout decisions
    shouldShowMobileLayout,
    shouldShowTabletLayout,
    shouldShowDesktopLayout,
    shouldUseTouchInteractions,
    shouldUseCardLayout,
    shouldStackElements,
    shouldHideSecondaryActions,
    
    // Breakpoint values
    breakpoints,
  };
};

export default useResponsiveLayout;

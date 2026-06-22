import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAccessibilityOptions {
  announceChanges?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  skipLinks?: boolean;
}

interface AccessibilityState {
  isScreenReaderActive: boolean;
  isHighContrastMode: boolean;
  isReducedMotion: boolean;
  isKeyboardNavigation: boolean;
  focusedElement: HTMLElement | null;
}

export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const {
    announceChanges = true,
    trapFocus = false,
    restoreFocus = true,
    skipLinks = true
  } = options;

  const [state, setState] = useState<AccessibilityState>({
    isScreenReaderActive: false,
    isHighContrastMode: false,
    isReducedMotion: false,
    isKeyboardNavigation: false,
    focusedElement: null
  });

  const announcementRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const trapContainerRef = useRef<HTMLElement | null>(null);

  // Initialize accessibility features
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create announcement region for screen readers
    if (announceChanges && !announcementRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.setAttribute('aria-relevant', 'text');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      announcer.id = 'accessibility-announcer';
      document.body.appendChild(announcer);
      announcementRef.current = announcer;
    }

    // Detect accessibility preferences
    const updateAccessibilityState = () => {
      setState(prev => ({
        ...prev,
        isHighContrastMode: window.matchMedia('(prefers-contrast: high)').matches,
        isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        isScreenReaderActive: !!document.querySelector('[aria-live]') || 
                             navigator.userAgent.includes('NVDA') ||
                             navigator.userAgent.includes('JAWS') ||
                             navigator.userAgent.includes('VoiceOver')
      }));
    };

    updateAccessibilityState();

    // Listen for preference changes
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    contrastQuery.addEventListener('change', updateAccessibilityState);
    motionQuery.addEventListener('change', updateAccessibilityState);

    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setState(prev => ({ ...prev, isKeyboardNavigation: true }));
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, isKeyboardNavigation: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      contrastQuery.removeEventListener('change', updateAccessibilityState);
      motionQuery.removeEventListener('change', updateAccessibilityState);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, [announceChanges]);

  // Announce message to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current || !announceChanges) return;

    announcementRef.current.setAttribute('aria-live', priority);
    announcementRef.current.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 1000);
  }, [announceChanges]);

  // Focus management
  const saveFocus = useCallback(() => {
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [restoreFocus]);

  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [restoreFocus]);

  const focusElement = useCallback((element: HTMLElement | string) => {
    const target = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element;
    
    if (target) {
      target.focus();
      setState(prev => ({ ...prev, focusedElement: target }));
    }
  }, []);

  // Focus trap for modals/dialogs
  const setupFocusTrap = useCallback((container: HTMLElement) => {
    if (!trapFocus) return () => {};

    trapContainerRef.current = container;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      trapContainerRef.current = null;
    };
  }, [trapFocus]);

  // Skip link functionality
  const createSkipLink = useCallback((targetId: string, label: string) => {
    if (!skipLinks) return null;

    const handleSkip = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    return (
      <a
        href={`#${targetId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-md focus:shadow-lg"
        onKeyDown={handleSkip}
      >
        {label}
      </a>
    );
  }, [skipLinks]);

  // ARIA helpers
  const getAriaProps = useCallback((options: {
    label?: string;
    labelledBy?: string;
    describedBy?: string;
    expanded?: boolean;
    selected?: boolean;
    checked?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    live?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
    relevant?: string;
    role?: string;
  }) => {
    const props: Record<string, any> = {};

    if (options.label) props['aria-label'] = options.label;
    if (options.labelledBy) props['aria-labelledby'] = options.labelledBy;
    if (options.describedBy) props['aria-describedby'] = options.describedBy;
    if (options.expanded !== undefined) props['aria-expanded'] = options.expanded;
    if (options.selected !== undefined) props['aria-selected'] = options.selected;
    if (options.checked !== undefined) props['aria-checked'] = options.checked;
    if (options.disabled !== undefined) props['aria-disabled'] = options.disabled;
    if (options.required !== undefined) props['aria-required'] = options.required;
    if (options.invalid !== undefined) props['aria-invalid'] = options.invalid;
    if (options.live) props['aria-live'] = options.live;
    if (options.atomic !== undefined) props['aria-atomic'] = options.atomic;
    if (options.relevant) props['aria-relevant'] = options.relevant;
    if (options.role) props['role'] = options.role;

    return props;
  }, []);

  // Keyboard navigation helpers
  const handleArrowNavigation = useCallback((
    e: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ) => {
    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    switch (e.key) {
      case nextKey:
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        onIndexChange(nextIndex);
        items[nextIndex]?.focus();
        break;
      case prevKey:
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        onIndexChange(prevIndex);
        items[prevIndex]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        onIndexChange(0);
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        const lastIndex = items.length - 1;
        onIndexChange(lastIndex);
        items[lastIndex]?.focus();
        break;
    }
  }, []);

  // Color contrast helpers
  const getContrastClass = useCallback((level: 'normal' | 'high' = 'normal') => {
    if (state.isHighContrastMode) {
      return level === 'high' ? 'contrast-more' : 'contrast-high';
    }
    return '';
  }, [state.isHighContrastMode]);

  // Motion helpers
  const getMotionClass = useCallback(() => {
    return state.isReducedMotion ? 'motion-reduce' : '';
  }, [state.isReducedMotion]);

  return {
    // State
    ...state,
    
    // Functions
    announce,
    saveFocus,
    restorePreviousFocus,
    focusElement,
    setupFocusTrap,
    createSkipLink,
    getAriaProps,
    handleArrowNavigation,
    getContrastClass,
    getMotionClass,
    
    // Refs
    announcementRef,
    previousFocusRef,
    trapContainerRef
  };
};

export default useAccessibility;

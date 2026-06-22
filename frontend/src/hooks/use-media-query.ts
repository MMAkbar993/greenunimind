import { useState, useEffect } from "react";

/**
 * Custom hook for responsive design that detects if a media query matches
 * @param query The media query to check, e.g. "(max-width: 768px)"
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current match state if window is available
  const getMatches = (): boolean => {
    // Check if window is defined (for SSR)
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches());

  useEffect(() => {
    // If window is not available (SSR), return early
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    
    // Update the state initially
    setMatches(mediaQuery.matches);

    // Create a handler function to update the state when the match changes
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Add the event listener
    mediaQuery.addEventListener("change", handler);

    // Clean up the event listener when the component unmounts
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export default useMediaQuery;

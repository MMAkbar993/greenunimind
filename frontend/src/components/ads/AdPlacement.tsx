import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Ad placement component for Google AdSense or similar ad networks.
 * Display ads in search results, between courses, or in the footer.
 *
 * Set VITE_ADSENSE_CLIENT_ID in .env to enable real ads (e.g. ca-pub-xxxxxxxxxx).
 * When not configured, shows a placeholder for development.
 */
interface AdPlacementProps {
  /** Slot ID for ad unit (e.g. 1234567890) */
  slot?: string;
  /** Layout: display, in-article, in-feed, etc. */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  /** Optional className */
  className?: string;
  /** Placement label for analytics */
  placement?: 'search' | 'courses' | 'footer' | 'sidebar';
}

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT_ID;

// Load AdSense script when client ID is configured
if (ADSENSE_CLIENT && typeof document !== 'undefined') {
  const id = 'adsense-script';
  if (!document.getElementById(id)) {
    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
}

export function AdPlacement({
  slot,
  format = 'auto',
  className,
  placement = 'footer',
}: AdPlacementProps) {
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!ADSENSE_CLIENT) return;

    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle =
        (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
    } catch {
      // Ignore push errors
    }
  }, []);

  if (!ADSENSE_CLIENT) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-dashed border-green-300/50 bg-green-50/30 text-green-700/60 text-xs',
          placement === 'footer' && 'min-h-[90px]',
          placement === 'search' && 'min-h-[120px]',
          placement === 'courses' && 'min-h-[250px]',
          className
        )}
        data-ad-placeholder
      >
        <span>Ad space • Add VITE_ADSENSE_CLIENT_ID to enable</span>
      </div>
    );
  }

  return (
    <div className={cn('ad-container', className)}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot || ''}
        data-ad-format={format}
        data-full-width-responsive="true"
        style={{ display: 'block' }}
      />
    </div>
  );
}

export default AdPlacement;

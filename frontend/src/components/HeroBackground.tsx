'use client';

import { useRef, useEffect } from 'react';

export function HeroBackground() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden opacity-60">
      <iframe
        ref={iframeRef}
        src="/assets/wireframe_network_bg.html"
        className="w-full h-full border-none pointer-events-none"
        title="Network Background Animation"
        aria-hidden="true"
        style={{ minWidth: '100vw', minHeight: '100vh' }}
      />
      {/* Overlay to ensure the content stays readable over the animation */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background pointer-events-none" />
    </div>
  );
}

import React, { useMemo } from 'react';

interface WatermarkProps {
  text: string;
}

export default function Watermark({ text }: WatermarkProps) {
  // Generate an SVG data URI with the text rotated diagonally
  // This approach ensures the watermark is tiled across the entire screen
  // seamlessly, is purely CSS-based (very performant), and cannot easily be selected or removed
  // by simply deleting a single HTML element if we were to just place a few divs.
  const svgDataUri = useMemo(() => {
    // Escape the text to be safe in SVG
    const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
        <text 
          x="50%" 
          y="50%" 
          dominant-baseline="middle" 
          text-anchor="middle" 
          fill="rgba(0, 0, 0, 0.05)" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-size="14" 
          font-weight="bold" 
          transform="rotate(-30 150 100)"
        >
          ${safeText}
        </text>
      </svg>
    `;
    
    // We encode the SVG to base64 or URI component. Using encodeURIComponent is often safer for CSS backgrounds.
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, [text]);

  if (!text) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        backgroundImage: svgDataUri,
        backgroundRepeat: 'repeat',
        // Optional: Adding mixBlendMode to make it slightly harder to remove via simple background color changes in devtools
        mixBlendMode: 'multiply',
      }}
      aria-hidden="true"
    />
  );
}

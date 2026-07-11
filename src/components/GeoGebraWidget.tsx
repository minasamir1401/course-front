"use client";

import React, { useEffect, useRef, useState } from "react";

interface GeoGebraWidgetProps {
  materialId?: string;
  iframeUrl?: string;
  w?: number;
  h?: number;
}

export default function GeoGebraWidget({ materialId = "", iframeUrl = "", w = 800, h = 500 }: GeoGebraWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const extractId = (urlOrId: string) => {
    if (!urlOrId) return "";
    const cleanUrl = urlOrId.trim();
    // Strip query params and hash for cleaner matching
    const urlWithoutQuery = cleanUrl.split('?')[0].split('#')[0];
    // Match ggbm.at/<id>
    const ggbmMatch = cleanUrl.match(/ggbm\.at\/([a-zA-Z0-9]+)/i);
    if (ggbmMatch) return ggbmMatch[1];
    
    // Extract path after geogebra.org/ and walk segments from the end
    const pathMatch = urlWithoutQuery.match(/geogebra\.org\/(.+)/i);
    if (pathMatch) {
      const keywords = ["classic", "calculator", "geometry", "3d", "notes", "applet", "evaluator", "material", "show", "edit", "m", "iframe", "id", "width", "height", "border", "sfsb", "smb", "stb", "stbh", "ai", "asb", "sri", "rc", "ld", "sdz", "ctl"];
      const segments = pathMatch[1].split('/').filter(Boolean);
      // Walk from the end to find the actual material ID (skip keywords and numeric-only values used for dimensions)
      for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        if (keywords.includes(seg.toLowerCase())) continue;
        // Skip pure numbers (they are width/height values like 800, 500)
        if (/^\d+$/.test(seg)) continue;
        // Skip boolean-like values
        if (['true', 'false'].includes(seg.toLowerCase())) continue;
        if (/^[a-zA-Z0-9]+$/.test(seg) && seg.length >= 3) return seg;
      }
    }
    
    if (/^[a-zA-Z0-9]+$/.test(cleanUrl) && cleanUrl.length >= 3) {
      return cleanUrl;
    }
    return "";
  };

  const id = extractId(iframeUrl) || extractId(materialId) || materialId;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const scriptId = "geogebra-deploy-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const injectApplet = () => {
      if (!containerRef.current || !(window as any).GGBApplet) {
        setLoading(false);
        return;
      }
      
      // Clear container
      containerRef.current.innerHTML = "";
      
      // Create a wrapper div inside the container to hold the applet
      const appletDiv = document.createElement("div");
      appletDiv.style.width = "100%";
      appletDiv.style.height = "100%";
      containerRef.current.appendChild(appletDiv);

      const params = {
        "appName": "classic",
        "material_id": id,
        "width": "100%",
        "height": h || 500,
        "showMenuBar": false,
        "showToolBar": false,
        "showAlgebraInput": false,
        "showAlgebraView": false, // Explicitly hide the sidebar panel
        "showResetIcon": true,
        "enableRightClick": false,
        "enableLabelDrags": false,
        "enableShiftDragZoom": true,
        "showZoomButtons": true,
        "errorDialogsActive": false,
        "scale": 1,
        "autoHeight": true,
        "allowScaleByDragDrop": true
      };

      const views = {
        "AV": 0,    // Algebra View OFF
        "SV": 0,    // Spreadsheet View OFF
        "CV": 0,    // CAS View OFF
        "EV2": 0,   // 2nd Graphics View OFF
        "is3D": 0   // 3D View OFF
      };

      try {
        const applet = new (window as any).GGBApplet(params, views);
        applet.inject(appletDiv);
        setLoading(false);
      } catch (err) {
        console.error("Error injecting GGBApplet:", err);
        setLoading(false);
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.geogebra.org/apps/deployggb.js";
      script.async = true;
      script.onload = injectApplet;
      document.body.appendChild(script);
    } else {
      if ((window as any).GGBApplet) {
        injectApplet();
      } else {
        const handleLoad = () => injectApplet();
        script.addEventListener("load", handleLoad);
        return () => script.removeEventListener("load", handleLoad);
      }
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [id, h]);

  return (
    <div className="w-full h-full min-h-[450px] relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-50">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-black text-slate-500 mt-3">جاري تحميل اللوحة الهندسية...</span>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[450px]" 
      />
    </div>
  );
}

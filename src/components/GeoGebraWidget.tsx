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
  const [useIframe, setUseIframe] = useState(true);

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

  let finalUrl = "";
  if (id) {
    finalUrl = `https://www.geogebra.org/material/iframe/id/${id}/width/${w}/height/${h}/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/true/rc/false/ld/false/sdz/false/ctl/false`;
  } else if (iframeUrl && iframeUrl.startsWith("http")) {
    finalUrl = iframeUrl;
  }

  useEffect(() => {
    if (finalUrl) return;

    const scriptId = "geogebra-deploy-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const injectApplet = () => {
      if (!containerRef.current || !(window as any).GGBApplet) return;
      containerRef.current.innerHTML = "";
      const params = {
        "appName": "classic",
        "material_id": id,
        "width": w || 800,
        "height": h || 500,
        "showMenuBar": false,
        "showToolBar": false,
        "showAlgebraInput": false,
        "showResetIcon": true,
        "enableRightClick": false,
        "enableLabelDrags": false,
        "enableShiftDragZoom": true,
        "showZoomButtons": true,
        "errorDialogsActive": false,
        "perspective": "G",
      };

      try {
        const applet = new (window as any).GGBApplet(params, true);
        applet.inject(containerRef.current);
      } catch (err) {
        console.error("Error injecting GGBApplet:", err);
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
  }, [id, finalUrl, w, h]);

  if (finalUrl) {
    return (
      <div className="w-full h-full min-h-[400px] bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-200">
        <iframe
          src={finalUrl}
          className="w-full h-full min-h-[400px] border-0"
          allow="fullscreen; autoplay; camera; microphone"
          title="GeoGebra Interactive Applet"
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden border border-slate-200" 
    />
  );
}

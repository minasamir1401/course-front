"use client";

import React, { useEffect, useRef } from "react";

interface GeoGebraWidgetProps {
  materialId: string;
  iframeUrl: string;
  w?: number;
  h?: number;
}

export default function GeoGebraWidget({ materialId, iframeUrl, w, h }: GeoGebraWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "geogebra-deploy-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    // Extract ID from URL if materialId is empty
    let id = materialId;
    if (!id && iframeUrl) {
      const idMatch = iframeUrl.match(/(?:geogebra\.org\/(?:calculator|m|material|classic|geometry|3d|notes|applet)\/|id\/)([a-zA-Z0-9]+)/i);
      id = idMatch ? idMatch[1] : (iframeUrl.match(/^[a-zA-Z0-9]+$/) ? iframeUrl : "");
    }

    const injectApplet = () => {
      if (!containerRef.current || !(window as any).GGBApplet) return;

      // Clear any previous children
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
        "perspective": "G", // Graphics only view (hides Algebra equations list)
        "appletOnLoad": (api: any) => {
          try {
            api.setPerspective("G"); // Reinforce hiding the sidebar/equations list
            api.showAlgebraInput(false);
          } catch (e) {
            console.error("Error setting perspective:", e);
          }
          // Reinforce again after 500ms and 1500ms to override any saved state layout settings
          setTimeout(() => {
            try {
              api.setPerspective("G");
              api.showAlgebraInput(false);
            } catch (e) {}
          }, 500);
          setTimeout(() => {
            try {
              api.setPerspective("G");
              api.showAlgebraInput(false);
            } catch (e) {}
          }, 1500);
        }
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
        return () => {
          script.removeEventListener("load", handleLoad);
        };
      }
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [materialId, iframeUrl, w, h]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden" 
    />
  );
}

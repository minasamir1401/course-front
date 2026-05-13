import { useEffect, useRef, useCallback } from "react";
import VimeoPlayer from "@vimeo/player";

interface VideoPlayerProps {
  url: string;
  initialSeconds?: number;
  onProgress?: (state: { playedSeconds: number }) => void;
}

function getVideoInfo(url: string): { type: 'youtube' | 'vimeo', id: string } | null {
  if (!url) return null;
  const normalized = url.trim();
  
  // YouTube patterns
  const ytPatterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
  ];
  for (const p of ytPatterns) {
    const m = normalized.match(p);
    if (m) return { type: 'youtube', id: m[1] };
  }
  
  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ];
  for (const p of vimeoPatterns) {
    const m = normalized.match(p);
    if (m) return { type: 'vimeo', id: m[1] };
  }
  return null;
}

export default function VideoPlayer({ url, onProgress }: VideoPlayerProps) {
  const youtubeRef = useRef<HTMLIFrameElement>(null);
  const vimeoContainerRef = useRef<HTMLDivElement>(null);
  const vimeoPlayerInstance = useRef<any>(null);
  
  const lastReportedTime = useRef(0);
  const onProgressRef = useRef(onProgress);
  const videoInfo = getVideoInfo(url);
  
  const videoType = videoInfo?.type;
  const videoId = videoInfo?.id;

  // Keep onProgress ref updated
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // Reset progress tracker when url changes
  useEffect(() => {
    lastReportedTime.current = 0;
  }, [url]);

  // Function to report progress to parent (no dependencies needed since we use ref)
  const reportProgress = useCallback((currentTime: number) => {
    const roundedTime = Math.floor(currentTime);
    // Report progress every 5 seconds
    if (roundedTime > lastReportedTime.current + 4 || (roundedTime > 0 && roundedTime % 5 === 0 && roundedTime !== lastReportedTime.current)) {
      // Progress reported internally
      if (onProgressRef.current) {
        onProgressRef.current({ playedSeconds: roundedTime });
      }
      lastReportedTime.current = roundedTime;
    }
  }, []);

  // YouTube native iframe handling
  useEffect(() => {
    if (videoType !== 'youtube' || !videoId) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin.includes("youtube.com")) {
        try {
          const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          if (data?.event === "infoDelivery" && data?.info?.currentTime !== undefined) {
            reportProgress(data.info.currentTime);
          }
        } catch (e) {}
      }
    };

    window.addEventListener("message", handleMessage);
    
    // Initial sync
    const syncInterval = setInterval(() => {
      if (youtubeRef.current?.contentWindow) {
        youtubeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "listening", id: 1 }),
          "*"
        );
      }
    }, 2000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(syncInterval);
    };
  }, [videoType, videoId, reportProgress]);

  // Vimeo official SDK handling
  useEffect(() => {
    if (videoType !== 'vimeo' || !videoId || !vimeoContainerRef.current) return;

    // Destroy existing instance if present
    if (vimeoPlayerInstance.current) {
      vimeoPlayerInstance.current.destroy().catch(() => {});
    }

    try {
      const player = new VimeoPlayer(vimeoContainerRef.current, {
        id: parseInt(videoId, 10),
        responsive: true,
        byline: false,
        title: false,
        portrait: false
      });

      player.on('timeupdate', (data: any) => {
        reportProgress(data.seconds);
      });

      vimeoPlayerInstance.current = player;
    } catch (e) {
      console.error("[VideoPlayer] Failed to initialize Vimeo player", e);
    }

    return () => {
      if (vimeoPlayerInstance.current) {
        vimeoPlayerInstance.current.destroy().catch(() => {});
        vimeoPlayerInstance.current = null;
      }
    };
  }, [videoType, videoId, reportProgress]);

  if (!videoType || !videoId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
        رابط الفيديو غير مدعوم
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black">
      {videoType === 'youtube' && (
        <iframe
          ref={youtubeRef}
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${origin}&rel=0&autoplay=0`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube Video Player"
          style={{ border: 'none' }}
        />
      )}
      
      {videoType === 'vimeo' && (
        <div 
          ref={vimeoContainerRef} 
          className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
        />
      )}
    </div>
  );
}

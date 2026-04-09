"use client";

import { useEffect, useRef, useState } from "react";

type PlyrPlayerProps = {
  youtubeId: string;
  title?: string;
};

export function PlyrPlayer({ youtubeId, title }: PlyrPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initPlayer() {
      // Load CSS dynamically
      if (!document.querySelector('link[href*="plyr"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.plyr.io/3.7.8/plyr.css";
        document.head.appendChild(link);
      }

      const Plyr = (await import("plyr")).default;

      if (!mounted || !containerRef.current) return;

      // Clear previous player
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      const div = containerRef.current;
      div.innerHTML = `<div data-plyr-provider="youtube" data-plyr-embed-id="${youtubeId}"></div>`;

      playerRef.current = new Plyr(div.firstChild as HTMLElement, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          "settings",
          "fullscreen",
        ],
        settings: ["quality", "speed"],
        quality: {
          default: 1080,
          options: [1080, 720, 480, 360],
        },
        youtube: {
          noCookie: true,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        tooltips: { controls: true, seek: true },
        ratio: "16:9",
      });

      playerRef.current.on("ready", () => {
        if (mounted) setReady(true);
      });
    }

    initPlayer();

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [youtubeId]);

  return (
    <div className="plyr-container overflow-hidden rounded-2xl border border-white/10">
      <div
        ref={containerRef}
        className={ready ? "" : "aspect-video bg-crypto-ink"}
        aria-label={title}
      />
    </div>
  );
}

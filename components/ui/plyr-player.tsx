"use client";

import { useEffect, useRef } from "react";
import "plyr/dist/plyr.css";

type PlyrPlayerProps = {
  youtubeId: string;
  title?: string;
};

export function PlyrPlayer({ youtubeId, title }: PlyrPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function initPlayer() {
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
          options: [4320, 2160, 1440, 1080, 720, 480, 360],
        },
        youtube: {
          noCookie: true,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
        },
        tooltips: { controls: true, seek: true },
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
    <div
      ref={containerRef}
      className="plyr-container overflow-hidden rounded-2xl"
      aria-label={title}
    />
  );
}

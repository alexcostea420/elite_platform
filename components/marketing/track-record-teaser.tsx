"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const R2 = "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images";

const screenshots = [
  { src: `${R2}/track-record/01-aug05-saptamana1-55pct-usdt.jpg`, alt: "5 Aug 2025 - Crearea grupului, 55% USDT" },
  { src: `${R2}/track-record/09-oct10-crash-vandut-tot.jpg`, alt: "10 Oct 2025 - Am vandut tot, e bearmarket" },
  { src: `${R2}/track-record/20-feb02-59pct-usdc-40pct-eth.jpg`, alt: "2 Feb 2026 - 40% ETH, executie conform planului" },
];

export function TrackRecordTeaser() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setLightbox(null); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <>
      <div className="mx-auto mt-8 grid max-w-3xl gap-3 grid-cols-3">
        {screenshots.map((s) => (
          <button
            key={s.alt}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition-all hover:border-white/[0.15] hover:-translate-y-0.5"
            onClick={() => setLightbox(s.src)}
            type="button"
          >
            <Image alt={s.alt} className="w-full" height={250} src={s.src} width={300} />
          </button>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 text-sm text-white/50 hover:text-white" onClick={() => setLightbox(null)} type="button">Inchide</button>
            <Image alt="Screenshot Discord" className="w-full rounded-xl border border-white/10" height={800} src={lightbox} width={700} unoptimized />
          </div>
        </div>
      )}
    </>
  );
}

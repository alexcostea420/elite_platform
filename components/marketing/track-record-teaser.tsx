"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const R2 = "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images";

const screenshots = [
  {
    src: `${R2}/track-record/01-aug05-saptamana1-55pct-usdt.jpg`,
    alt: "5 Aug 2025 - Crearea grupului, 55% USDT",
    date: "5 August 2025",
    title: "Săptămâna 1 - deja 55% cash",
    context: "Prima săptămână de când am înființat grupul. Deja defensiv.",
  },
  {
    src: `${R2}/track-record/09-oct10-crash-vandut-tot.jpg`,
    alt: "10 Oct 2025 - Am vândut tot, e bearmarket",
    date: "10 Octombrie 2025",
    title: "'E BEARMARKET. Am vândut tot.'",
    context: "Eram pe grafic live. BTC a picat $5,000 în 2 minute. Am ieșit la -10% în loc de -60%.",
  },
  {
    src: `${R2}/track-record/20-feb02-59pct-usdc-40pct-eth.jpg`,
    alt: "2 Feb 2026 - 40% ETH, execuție conform planului",
    date: "2 Februarie 2026",
    title: "40% ETH - execuție conform planului",
    context: "Am intrat exact în zona anunțată. 59% USDC + 40% ETH.",
  },
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
      <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-6">
        {screenshots.map((s) => (
          <div key={s.alt} className="flex flex-col gap-4 md:flex-row md:items-center">
            <button
              className="flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition-all hover:border-white/[0.15] hover:-translate-y-0.5"
              onClick={() => setLightbox(s.src)}
              type="button"
            >
              <Image alt={s.alt} className="w-full" height={600} src={s.src} width={800} unoptimized />
            </button>
            <div className="flex-1 md:pl-2">
              <p className="text-xs font-mono text-slate-600">{s.date}</p>
              <h3 className="mt-1 text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.context}</p>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 text-sm text-white/50 hover:text-white" onClick={() => setLightbox(null)} type="button">Închide</button>
            <Image alt="Screenshot Discord" className="w-full rounded-xl border border-white/10" height={800} src={lightbox} width={700} unoptimized />
          </div>
        </div>
      )}
    </>
  );
}

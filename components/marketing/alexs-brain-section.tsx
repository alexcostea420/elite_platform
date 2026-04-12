"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const images = [
  { src: "/alexs-brain/ab5-cvx-trade-analysis.jpg", alt: "Validare trade cu PRO/CONTRA" },
  { src: "/alexs-brain/ab8-eth-pdh-strategy.jpg", alt: "Setup complet: entry, TP, SL" },
  { src: "/alexs-brain/ab3-hype-long-or-short.jpg", alt: "Analiza: long sau short?" },
  { src: "/alexs-brain/ab4-eth-trade-management.jpg", alt: "Trade management - 3 optiuni exit" },
  { src: "/alexs-brain/ab6-eth-breakout-structura.jpg", alt: "Analiza structura si niveluri" },
  { src: "/alexs-brain/ab2-quiz-suporti-rezistente.jpg", alt: "Quiz interactiv" },
  { src: "/alexs-brain/ab7-video-links-rsi-fibonacci.jpg", alt: "Gaseste video-ul relevant" },
  { src: "/alexs-brain/ab1-intro-salut.jpg", alt: "Ce poate face Alex's Brain" },
];

export function AlexsBrainSection() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setLightbox(null); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <>
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-emerald mb-3">EXCLUSIV ELITE</p>
        <h2 className="text-2xl font-bold text-white md:text-4xl">Mentorul tau personal de trading. Disponibil 24/7.</h2>
        <div className="mx-auto mt-6 max-w-xl space-y-2 text-sm leading-relaxed text-slate-400 md:text-base">
          <p>Alex&apos;s Brain - un asistent AI antrenat pe toata metodologia, video-urile si analizele lui Alex.</p>
          <p>Ii pui o intrebare, iti da raspunsul.</p>
          <p>Ii arati un chart, iti spune ce vede.</p>
          <p>Ii dai un trade, iti zice daca e bun sau nu.</p>
          <p className="text-white font-medium">Ca si cum l-ai avea pe Alex langa tine non-stop.</p>
        </div>
      </div>
      <div className="mb-6 flex items-center justify-center gap-8 text-xs text-slate-500">
        <span className="flex items-center gap-2">📊 <span>Analiza chart-uri</span></span>
        <span className="flex items-center gap-2">🎯 <span>Validare trade-uri</span></span>
        <span className="flex items-center gap-2">🧪 <span>Quiz-uri practice</span></span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        {images.map((img) => (
          <button
            key={img.src}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition-all hover:border-white/[0.15] hover:-translate-y-0.5"
            onClick={() => setLightbox(img.src)}
            type="button"
          >
            <Image alt={img.alt} className="w-full object-cover" height={300} loading="lazy" src={img.src} width={300} style={{ aspectRatio: "1/1.2" }} />
          </button>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm text-slate-400 mb-4">Alex&apos;s Brain este disponibil exclusiv pentru membrii Elite pe Discord.</p>
        <Link className="accent-button" href="/signup">Incepe Gratuit - 7 Zile →</Link>
        <p className="mt-3 text-xs text-slate-600">Acces complet la Alex&apos;s Brain inclus in orice plan Elite</p>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 text-sm text-white/50 hover:text-white" onClick={() => setLightbox(null)} type="button">Inchide</button>
            <Image alt="Alex's Brain screenshot" className="w-full rounded-xl border border-white/10" height={800} src={lightbox} width={700} />
          </div>
        </div>
      )}
    </>
  );
}

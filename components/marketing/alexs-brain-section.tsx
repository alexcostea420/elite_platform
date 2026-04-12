"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const images = [
  { src: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/alexs-brain/ab5-cvx-trade-analysis.jpg", alt: "Validare trade cu PRO/CONTRA" },
  { src: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/alexs-brain/ab8-eth-pdh-strategy.jpg", alt: "Setup complet: entry, TP, SL" },
  { src: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/alexs-brain/ab3-hype-long-or-short.jpg", alt: "Analiza: long sau short?" },
  { src: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/alexs-brain/ab4-eth-trade-management.jpg", alt: "Trade management - 3 optiuni exit" },
  { src: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/alexs-brain/ab6-eth-breakout-structura.jpg", alt: "Analiza structura si niveluri" },
  { src: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/alexs-brain/ab2-quiz-suporti-rezistente.jpg", alt: "Quiz interactiv" },
  { src: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/alexs-brain/ab7-video-links-rsi-fibonacci.jpg", alt: "Gaseste video-ul relevant" },
  { src: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/alexs-brain/ab1-intro-salut.jpg", alt: "Ce poate face Alex's Brain" },
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
        <h2 className="text-2xl font-bold text-white md:text-4xl">Mentorul tău personal de trading. Disponibil <span className="text-accent-emerald">24/7</span>.</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400 md:text-base">
          Alex&apos;s Brain - un asistent AI antrenat pe toată metodologia, video-urile și analizele lui Alex.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {[
          { icon: "💬", title: "Întreabă orice", desc: "Pune orice întrebare despre trading, metodologie sau piață. Primești răspuns instant bazat pe experiența lui Alex." },
          { icon: "📊", title: "Trimite un chart", desc: "Uploadează orice chart și primești analiză completă - structură, niveluri cheie, bias și setup-uri posibile." },
          { icon: "🎯", title: "Validează trade-uri", desc: "Arată-i un trade înainte să intri. Îți spune dacă e bun, ce risc ai și ce ar schimba." },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all hover:border-white/[0.15] hover:bg-white/[0.05]">
            <div className="text-3xl mb-3">{c.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{c.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-base font-medium text-white/80 italic mb-8">
        Ca și cum l-ai avea pe Alex lângă tine non-stop.
      </p>
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
        <Link className="accent-button" href="/signup">Începe Gratuit - 7 Zile →</Link>
        <p className="mt-3 text-xs text-slate-600">Acces complet la Alex&apos;s Brain inclus în orice plan Elite</p>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 text-sm text-white/50 hover:text-white" onClick={() => setLightbox(null)} type="button">Închide</button>
            <Image alt="Alex's Brain screenshot" className="w-full rounded-xl border border-white/10" height={800} src={lightbox} width={700} />
          </div>
        </div>
      )}
    </>
  );
}

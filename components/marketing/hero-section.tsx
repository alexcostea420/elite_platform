"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/constants/site";

export function HeroSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    if (!isVideoOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsVideoOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVideoOpen]);

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-20 pt-32">
        <div className="absolute inset-0 bg-hero-radial opacity-90" />
        <div className="absolute inset-0 grid-glow opacity-20" />
        <Container className="relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex flex-col items-center gap-6 md:gap-8">
              <div className="inline-flex rounded-full border border-accent-emerald/30 bg-surface-graphite px-4 py-2">
                <span className="font-semibold text-accent-emerald">🎯 350+ membri activi · 50+ Elite</span>
              </div>
              <div className="space-y-6">
                <h1 className="text-5xl font-bold leading-tight text-white md:text-7xl">
                  Învață să tranzacționezi
                  <br />
                  <span className="gradient-text">ca un profesionist</span>
                </h1>
                <p className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-300 md:text-2xl">
                  Comunitate de investitori și traderi cu rezultate reale. Indicatori exclusivi, sesiuni live cu ajustare de portofoliu și acces la bot de trading AI. Începe gratuit — 3 zile acces complet.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link className="accent-button min-w-[220px] px-8 py-4 text-lg font-bold" href="#preturi">
                  Începe Acum →
                </Link>
                <button
                  className="ghost-button min-w-[220px] px-8 py-4 text-lg font-bold"
                  onClick={() => setIsVideoOpen(true)}
                  type="button"
                >
                  Vezi prezentarea
                </button>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent-emerald/30 bg-accent-emerald/5 px-4 py-2 text-sm">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <span className="text-slate-300">
                  <span className="font-semibold text-accent-emerald">48 membri activi</span> în comunitate acum
                </span>
              </div>
              <p className="text-sm text-slate-500">✨ Peste 50 membri Elite · Indicator TradingView inclus</p>
            </div>
          </div>
        </Container>
      </section>

      {isVideoOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <button
            aria-label="Închide prezentarea"
            className="absolute inset-0"
            onClick={() => setIsVideoOpen(false)}
            type="button"
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface-graphite shadow-glow">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-emerald">Prezentare</p>
                <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">Vezi cum funcționează comunitatea</h2>
              </div>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl text-white transition-colors hover:bg-white/10"
                onClick={() => setIsVideoOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="p-4 md:p-6">
              <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-crypto-ink">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src="https://www.youtube-nocookie.com/embed/nFL-FSF1ZR4?autoplay=1"
                  title="Prezentare Armata de Traderi"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

import { AuroraBg } from "@/components/ui/aurora-bg";
import { Container } from "@/components/ui/container";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { ParticlesBg } from "@/components/ui/particles-bg";

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
        <AuroraBg />
        <div className="absolute inset-0 grid-glow opacity-20" />
        <ParticlesBg className="z-[1]" />
        <Container className="relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex flex-col items-center gap-6 md:gap-8">
              <div className="inline-flex rounded-full border border-accent-emerald/30 bg-surface-graphite px-4 py-2">
                <span className="font-semibold text-accent-emerald">350+ traderi activi · Peste 50 membri Elite</span>
              </div>
              <div className="space-y-6">
                <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl md:text-7xl animate-scale-in">
                  Investește și tranzacționează
                  <br />
                  <span className="gradient-text">cu un plan clar.</span>
                </h1>
                <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-300 sm:text-xl md:text-2xl">
                  Comunitate de investitori și traderi cu rezultate reale.
                  <br className="hidden sm:block" />
                  Risk Score săptămânal, analize live, indicatori exclusivi și portofoliu transparent.
                  <br className="hidden sm:block" />
                  Începe gratuit - 7 zile acces complet.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <MagneticButton
                  href="/signup"
                  className="accent-button gradient-border-animated w-full rounded-xl px-6 py-4 text-base font-bold sm:w-auto sm:min-w-[220px] sm:px-8 sm:text-lg"
                >
                  Începe Gratuit - 7 Zile →
                </MagneticButton>
                <MagneticButton
                  className="ghost-button w-full rounded-xl px-6 py-4 text-base font-bold sm:w-auto sm:min-w-[220px] sm:px-8 sm:text-lg"
                  onClick={() => setIsVideoOpen(true)}
                >
                  Vezi prezentarea
                </MagneticButton>
              </div>
              <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
                <span><span className="font-semibold text-white">350+</span> Traderi</span>
                <span className="h-3 w-px bg-white/10" />
                <span><span className="font-semibold text-white">55+</span> Video-uri</span>
                <span className="h-3 w-px bg-white/10" />
                <span><span className="font-semibold text-white">4+</span> Ani Experiență</span>
                <span className="h-3 w-px bg-white/10" />
                <span><span className="font-semibold text-white">7</span> Zile Trial</span>
              </div>
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
                aria-label="Închide prezentarea"
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

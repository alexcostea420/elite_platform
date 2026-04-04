"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/lib/constants/site";

const bulletPoints = [
  "Sesiuni live de trading săptămânale",
  "Indicator ELITE exclusiv pentru TradingView",
  "Comunitate Discord dedicată",
];

const credibilityStats = [
  { value: "4+", label: "Ani de trading activ", icon: "📈" },
  { value: "350+", label: "Membri în comunitate", icon: "👥" },
  { value: "24/7", label: "Bot AI trading", icon: "🤖" },
];

export function AboutSection() {
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
      <section className="px-4 py-20" id="despre">
        <Container>
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="rounded-[1.75rem] bg-emerald-gradient p-[1px] shadow-glow">
                <div className="rounded-[1.7rem] bg-surface-graphite p-4 md:p-5">
                  <button
                    className="group block w-full text-left"
                    onClick={() => setIsVideoOpen(true)}
                    type="button"
                  >
                    <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-crypto-ink">
                      <Image
                        alt={`Prezentare video ${siteConfig.creator} pentru comunitate trading crypto din România`}
                        className="object-cover transition duration-300 group-hover:scale-[1.02] group-hover:opacity-90"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        src="https://img.youtube.com/vi/nFL-FSF1ZR4/maxresdefault.jpg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-accent-emerald text-3xl text-crypto-dark shadow-glow transition duration-300 group-hover:scale-105">
                          ▶
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-emerald">
                          Prezentare video
                        </p>
                        <p className="mt-2 text-2xl font-bold text-white md:text-3xl">
                          Vezi cine construiește comunitatea și cum lucrează
                        </p>
                        <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300 md:text-base">
                          O introducere directă în stilul de lucru, conținutul și standardul comunității Armata de Traderi.
                        </p>
                      </div>
                    </div>
                  </button>
                  <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{siteConfig.creator}</p>
                      <p className="text-sm text-slate-400">Trader & Educator</p>
                    </div>
                    <button
                      className="ghost-button px-5 py-2.5 text-sm font-semibold"
                      onClick={() => setIsVideoOpen(true)}
                      type="button"
                    >
                      Deschide video
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <SectionHeading align="left" title={<>Despre <span className="gradient-text">{siteConfig.creator}</span></>} />
              <p className="mt-6 text-lg leading-relaxed text-slate-300">
                Cu <strong className="text-white">4 ani de experiență în trading crypto</strong>, Alex a construit o comunitate de peste 350 de traderi activi. Împărtășește strategii practice și oferă acces la indicatori exclusivi pentru TradingView.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-slate-300">
                Cu sesiuni live de trading, analize săptămânale detaliate și o comunitate activă pe Discord, Armata de Traderi este locul unde învățarea devine execuție reală.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {credibilityStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center">
                    <span className="mb-1 block text-2xl">{stat.icon}</span>
                    <p className="text-xl font-bold text-accent-emerald">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {bulletPoints.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="text-2xl text-crypto-green">✓</span>
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-emerald">Despre Alex Costea</p>
                <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">Vezi prezentarea comunității</h2>
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
                  title="Prezentare Alex Costea"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

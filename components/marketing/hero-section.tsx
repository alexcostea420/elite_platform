"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { AuroraBg } from "@/components/ui/aurora-bg";
import { Container } from "@/components/ui/container";
import { CountUp } from "@/components/ui/count-up";
import { MagneticButton } from "@/components/ui/magnetic-button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

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
        <Container className="relative z-10">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
          >
            <div className="flex flex-col items-center gap-6 md:gap-8">
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex rounded-full border border-accent-emerald/30 bg-surface-graphite px-4 py-2"
              >
                <span className="font-semibold text-accent-emerald">350+ traderi activi · Peste 50 membri Elite</span>
              </motion.div>
              <div className="space-y-6">
                <motion.h1
                  variants={fadeUp}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="text-3xl font-bold leading-tight text-white sm:text-5xl md:text-7xl"
                >
                  Investește și tranzacționează
                  <br />
                  <span className="gradient-text">cu un plan clar.</span>
                </motion.h1>
                <motion.p
                  variants={fadeUp}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-300 sm:text-xl md:text-2xl"
                >
                  Comunitate de investitori și traderi cu rezultate reale.
                  <br className="hidden sm:block" />
                  Risk Score săptămânal, analize live, indicatori exclusivi și portofoliu transparent.
                  <br className="hidden sm:block" />
                  Începe gratuit - 7 zile acces complet.
                </motion.p>
              </div>
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
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
              </motion.div>
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-500"
              >
                <span>
                  <span className="font-semibold text-white tabular-nums">
                    <CountUp end={350} duration={1400} />+
                  </span> Traderi
                </span>
                <span className="h-3 w-px bg-white/10" />
                <span>
                  <span className="font-semibold text-white tabular-nums">
                    <CountUp end={55} duration={1400} />+
                  </span> Video-uri
                </span>
                <span className="h-3 w-px bg-white/10" />
                <span>
                  <span className="font-semibold text-white tabular-nums">
                    <CountUp end={4} duration={1200} />+
                  </span> Ani Experiență
                </span>
                <span className="h-3 w-px bg-white/10" />
                <span>
                  <span className="font-semibold text-white tabular-nums">
                    <CountUp end={7} duration={1200} />
                  </span> Zile Trial
                </span>
              </motion.div>
            </div>
          </motion.div>
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

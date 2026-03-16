"use client";

import { useEffect, useState } from "react";

type MarketingDiscordButtonProps = {
  href: string;
};

export function MarketingDiscordButton({ href }: MarketingDiscordButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        className="ghost-button flex items-center justify-center px-3 py-2.5 text-center text-xs sm:text-sm md:px-5"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Discord
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <button
            aria-label="Închide avertismentul Discord"
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface-graphite shadow-glow">
            <div className="border-b border-white/10 px-5 py-4 md:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-emerald">Comunitate Discord</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Înainte să intri, trebuie să știi exact ce primești</h2>
            </div>
            <div className="space-y-4 p-5 md:p-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Free / Soldat</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Accesul gratuit include doar un singur chat Free și punctul de intrare în comunitate.
                </p>
              </div>
              <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-emerald">Elite</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  Elite include analize zilnice, trade ideas, portofoliu Elite, instrumente exclusive, indicator dedicat și contextul premium complet.
                </p>
              </div>
              <p className="text-sm text-slate-400">
                Dacă vrei doar să vezi comunitatea, poți intra ca Free. Dacă vrei accesul real la conținutul valoros, nivelul Elite este cel care deblochează tot.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="ghost-button"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Rămâi pe site
                </button>
                <a
                  className="accent-button"
                  href={href}
                  rel="noreferrer"
                  target="_blank"
                >
                  Continuă spre Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

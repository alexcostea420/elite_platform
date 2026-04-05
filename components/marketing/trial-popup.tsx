"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function TrialPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("trial_popup_dismissed")) {
      setDismissed(true);
      return;
    }

    function handleScroll() {
      // Show after scrolling 40% of page
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.4 && !dismissed) {
        setShow(true);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissed]);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("trial_popup_dismissed", "1");
  }

  if (!show || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Popup */}
      <div className="relative w-full max-w-md rounded-3xl border border-accent-emerald/20 bg-surface-graphite p-8 text-center shadow-2xl">
        <button
          className="absolute right-4 top-4 text-slate-500 transition-colors hover:text-white"
          onClick={dismiss}
          type="button"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="mb-3 text-4xl">🪖</div>
        <h3 className="text-xl font-bold text-white">
          3 zile gratuit. Zero risc.
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm text-slate-400">
          Acces complet la Discord Elite, video-uri, indicatori si portofoliul live.
          Fara card. Se anuleaza automat.
        </p>

        <Link
          className="accent-button mt-6 inline-block rounded-xl px-8 py-3 text-sm font-semibold"
          href="/signup"
          onClick={dismiss}
        >
          Incepe acum - gratuit
        </Link>

        <button
          className="mt-3 block w-full text-xs text-slate-600 transition-colors hover:text-slate-400"
          onClick={dismiss}
          type="button"
        >
          Nu acum
        </button>
      </div>
    </div>
  );
}

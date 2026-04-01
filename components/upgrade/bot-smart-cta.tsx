"use client";

import { useState } from "react";
import Link from "next/link";

export function BotSmartCta() {
  const [showBanner, setShowBanner] = useState(false);

  return (
    <>
      {showBanner ? (
        <div className="mt-6 rounded-xl border border-accent-emerald/30 bg-accent-emerald/10 p-4 text-center">
          <p className="text-sm font-semibold text-accent-emerald">
            Intra si in Elite si platesti doar $29/luna pentru bot! Economisesti $240/an
          </p>
          <Link
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-accent-emerald px-5 py-2 text-sm font-bold text-crypto-dark hover:bg-accent-soft"
            href="#planuri"
          >
            Vezi planurile Elite
          </Link>
        </div>
      ) : (
        <button
          className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          onClick={() => setShowBanner(true)}
          type="button"
        >
          Vreau doar botul la $49/luna
        </button>
      )}
    </>
  );
}

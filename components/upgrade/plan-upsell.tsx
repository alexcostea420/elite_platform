"use client";

import { useState } from "react";
import Link from "next/link";

type PlanUpsellProps = {
  planSlug: string;
  planLabel: string;
  planPrice: string;
};

export function PlanUpsellTrigger({
  planSlug,
  planLabel,
  planPrice,
  children,
}: PlanUpsellProps & { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>
      {open && (
        <PlanUpsellModal
          planSlug={planSlug}
          planLabel={planLabel}
          planPrice={planPrice}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PlanUpsellModal({
  planSlug,
  planLabel,
  planPrice,
  onClose,
}: PlanUpsellProps & { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="panel max-w-lg w-full mx-4 p-6 md:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          aria-label="Închide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
          Știai că Alex oferă și un Bot de Trading?
        </h2>
        <p className="text-white/60 text-sm md:text-base mb-6">
          Botul tradeuiește automat pe contul tău Hyperliquid, 24/7. Bitcoin,
          Ethereum, Altcoins și TradFi.
        </p>

        {/* Option A — Bundle (highlighted) */}
        <div className="border border-accent-emerald bg-accent-emerald/5 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">
              Elite + Bot Bundle
            </h3>
            <span className="text-accent-emerald font-bold text-lg">
              $94/lună
            </span>
          </div>
          <p className="text-accent-emerald text-sm font-medium mb-3">
            Economisești $53/lună
          </p>
          <p className="text-white/50 text-sm mb-4">
            Comunitate + Bot + Dashboard
          </p>
          <Link
            href="/upgrade/pay?plan=elite_bot_bundle"
            className="accent-button w-full text-center block"
          >
            Vreau Bundle-ul
          </Link>
        </div>

        {/* Option B — Community only (ghost) */}
        <div className="border border-white/10 bg-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">
              Doar comunitatea — {planPrice}
            </h3>
          </div>
          <p className="text-white/50 text-sm mb-4">
            Fără bot, doar acces Elite
          </p>
          <Link
            href={`/upgrade/pay?plan=${planSlug}`}
            className="ghost-button w-full text-center block"
          >
            Continuă fără bot
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PlanUpsellModal;

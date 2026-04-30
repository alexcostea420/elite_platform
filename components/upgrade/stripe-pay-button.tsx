"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StripePayButtonProps = {
  plan: string;
  highlighted?: boolean;
};

export function StripePayButton({ plan, highlighted }: StripePayButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    router.push(`/upgrade/pay/card?plan=${encodeURIComponent(plan)}`);
  };

  return (
    <button
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-colors ${
        highlighted
          ? "bg-accent-emerald text-crypto-dark hover:bg-accent-soft"
          : "bg-slate-700 text-white hover:bg-slate-600"
      } disabled:opacity-50`}
      disabled={loading}
      onClick={handleClick}
      type="button"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Se deschide…
        </>
      ) : (
        <>💳 Plătește cu cardul</>
      )}
    </button>
  );
}

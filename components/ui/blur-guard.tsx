"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * BlurGuard - wraps content with blur when ?blur=1 is in URL (presentation mode).
 * Used for YouTube recordings to hide sensitive Elite data.
 */
export function BlurGuard({ children, label }: { children: React.ReactNode; label?: string }) {
  const params = useSearchParams();
  const isBlurred = params.get("blur") === "1";

  if (!isBlurred) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-[6px] select-none pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Link
          href="/upgrade"
          className="rounded-xl border border-accent-emerald/30 bg-crypto-dark/90 px-4 py-2 text-xs font-bold text-accent-emerald shadow-lg backdrop-blur-sm transition hover:bg-accent-emerald/10"
        >
          🔒 {label ?? "Elite Only"}
        </Link>
      </div>
    </div>
  );
}

/** Hook to check if presentation mode is active */
export function useBlurMode(): boolean {
  const params = useSearchParams();
  return params.get("blur") === "1";
}

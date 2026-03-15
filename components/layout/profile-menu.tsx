"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { logoutAction } from "@/app/auth/actions";

type ProfileMenuProps = {
  dashboardHref: string;
  displayName: string;
  initials: string;
  settingsHref: string;
};

export function ProfileMenu({
  dashboardHref,
  displayName,
  initials,
  settingsHref,
}: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <div className="hidden text-right md:block">
          <div className="text-sm text-slate-400">Bine ai venit,</div>
          <div className="font-semibold text-white">{displayName}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-emerald font-bold text-crypto-dark">
          {initials}
        </div>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 min-w-[220px] rounded-2xl border border-white/10 bg-surface-graphite/95 p-2 shadow-card backdrop-blur-sm">
          <Link
            className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-accent-emerald"
            href={dashboardHref}
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-accent-emerald"
            href={settingsHref}
            onClick={() => setIsOpen(false)}
          >
            Setări
          </Link>
          <form action={logoutAction}>
            <button
              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-accent-emerald"
              type="submit"
            >
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

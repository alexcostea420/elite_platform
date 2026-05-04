"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { logoutAction } from "@/app/auth/actions";

type ProfileMenuProps = {
  dashboardHref: string;
  displayName: string;
  initials: string;
  settingsHref: string;
  isAdmin?: boolean;
};

export function ProfileMenu({
  dashboardHref,
  displayName,
  initials,
  settingsHref,
  isAdmin = false,
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
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 min-w-[220px] rounded-2xl border border-white/10 bg-crypto-dark/95 p-2 shadow-card backdrop-blur-sm">
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
          {isAdmin ? (
            <>
              <div className="my-1 border-t border-white/5" />
              <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/70">
                Admin
              </p>

              <p className="px-4 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Pulse
              </p>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Dashboard
              </Link>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/funnel"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Funnel
              </Link>

              <p className="px-4 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Membri
              </p>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/members"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Membri
              </Link>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/segments"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Segmente
              </Link>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/retention"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Retenție
              </Link>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/churn"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Churn risk
              </Link>

              <p className="px-4 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Conținut
              </p>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/videos"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Videos
              </Link>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/video-engagement"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Video Engagement
              </Link>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/invites"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Invites
              </Link>

              <p className="px-4 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Bani
              </p>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/payments"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Payments
              </Link>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/revenue"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Revenue
              </Link>

              <p className="px-4 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Comunicare
              </p>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/inbox"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Inbox
              </Link>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/email-analytics"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Email Analytics
              </Link>

              <p className="px-4 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Sistem
              </p>
              <Link
                className="block rounded-xl px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
                href="/admin/audit"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Audit Log
              </Link>

              <div className="my-1 border-t border-white/5" />
            </>
          ) : null}
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

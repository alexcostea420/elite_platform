"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type SearchItem = {
  label: string;
  href: string;
  icon: string;
  group: string;
};

const SEARCH_ITEMS: SearchItem[] = [
  // Dashboard
  { label: "Dashboard", href: "/dashboard", icon: "🏠", group: "Pagini" },
  { label: "Astăzi", href: "/dashboard/today", icon: "🗓️", group: "Pagini" },
  { label: "Portofoliul Tău", href: "/dashboard/portfolio", icon: "💼", group: "Pagini" },
  { label: "Video-uri", href: "/dashboard/videos", icon: "🎬", group: "Pagini" },
  { label: "Resurse", href: "/dashboard/resurse", icon: "📚", group: "Pagini" },
  { label: "Indicatori TradingView", href: "/dashboard/indicators", icon: "📈", group: "Pagini" },
  // Research
  { label: "Stocks - Portofoliu Acțiuni", href: "/dashboard/stocks", icon: "💹", group: "Research" },
  { label: "Crypto Screener", href: "/dashboard/crypto", icon: "₿", group: "Research" },
  // { label: "Pivoți BTC", href: "/dashboard/pivots", icon: "🔮", group: "Research" }, // Admin-only
  // Countertrade hidden until verified (admin-only)
  { label: "Calendar Economic", href: "/dashboard/calendar", icon: "📅", group: "Research" },
  { label: "Macro Dashboard", href: "/dashboard/macro", icon: "🌐", group: "Research" },
  { label: "Whale Tracker Hyperliquid", href: "/tools/whale-tracker", icon: "🐋", group: "Research" },
  { label: "Știri Crypto Live", href: "/dashboard/news", icon: "📰", group: "Research" },
  // Trading
  { label: "Risk Score BTC", href: "/dashboard/risk-score", icon: "🎯", group: "Trading" },
  { label: "Should I Trade?", href: "/dashboard/should-i-trade", icon: "⚡", group: "Trading" },
  // Account
  { label: "Sesiuni 1-la-1 cu Alex", href: "/sesiuni", icon: "🎓", group: "Cont" },
  { label: "Upgrade / Plăți", href: "/upgrade", icon: "💳", group: "Cont" },
  { label: "Track Record - Performanță", href: "/track-record", icon: "📊", group: "Cont" },
  { label: "Conectează Discord", href: "/auth/discord", icon: "💬", group: "Cont" },
  // External
  { label: "Alex's Brain - Bot Discord", href: "/dashboard/ask-alex", icon: "🧠", group: "Pagini" },
  { label: "Bot Trading", href: "/bots", icon: "🤖", group: "Cont" },
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter items
  const filtered = query.trim()
    ? SEARCH_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.group.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCH_ITEMS;

  // Group by category
  const grouped = filtered.reduce((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  const flatFiltered = Object.values(grouped).flat();

  // Keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  // Arrow keys + Enter
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatFiltered[selectedIndex]) {
      navigate(flatFiltered[selectedIndex].href);
    }
  }, [flatFiltered, selectedIndex, navigate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-crypto-dark shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
            placeholder="Caută pagini, tools, resurse..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={onKeyDown}
          />
          <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500 sm:inline">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-1">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {group}
              </p>
              {items.map((item) => {
                const idx = flatFiltered.indexOf(item);
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.href}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "bg-accent-emerald/10 text-white"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                    onClick={() => navigate(item.href)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    type="button"
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {isSelected && <span className="text-xs text-slate-600">↵</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {flatFiltered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate-600">
              Niciun rezultat pentru &quot;{query}&quot;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small button trigger for the navbar */
export function CommandSearchTrigger() {
  return (
    <button
      className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-500 transition hover:border-white/20 hover:text-slate-300 md:flex"
      onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
      type="button"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
      Caută
      <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px]">⌘K</kbd>
    </button>
  );
}

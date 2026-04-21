"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type NavDropdownProps = {
  label: string;
  items: { href: string; label: string; icon?: string; badge?: string }[];
};

export function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isActive = items.some((item) => pathname.startsWith(item.href));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className={`flex items-center gap-1 text-sm font-medium transition-colors ${
          isActive ? "text-accent-emerald" : "text-slate-200 hover:text-accent-emerald"
        }`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-[180px] rounded-xl border border-white/10 bg-crypto-dark/95 p-1.5 shadow-card backdrop-blur-sm">
          {items.map((item) => (
            <Link
              key={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-white/5 text-accent-emerald"
                  : "text-slate-300 hover:bg-white/5 hover:text-accent-emerald"
              }`}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.icon && <span className="text-base">{item.icon}</span>}
              {item.label}
              {item.badge && (
                <span className="ml-auto rounded-full bg-accent-emerald/20 px-1.5 py-0.5 text-[10px] font-bold text-accent-emerald">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

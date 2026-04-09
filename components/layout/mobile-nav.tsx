"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

type NavGroup = {
  label: string;
  items: { href: string; label: string; icon?: string }[];
};

type MobileNavProps = {
  groups: NavGroup[];
  standalone: { href: string; label: string; icon?: string }[];
};

export function MobileNav({ groups, standalone }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [navbarHeight, setNavbarHeight] = useState(56);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Measure navbar height
  useEffect(() => {
    const navbar = document.querySelector("nav");
    if (navbar) {
      setNavbarHeight(navbar.getBoundingClientRect().height);
    }
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        aria-label={open ? "Inchide meniu" : "Deschide meniu"}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[54] bg-black/50"
            onClick={() => setOpen(false)}
            style={{ top: navbarHeight }}
          />
          {/* Menu */}
          <div
            className="fixed inset-x-0 bottom-0 z-[55] overflow-y-auto bg-crypto-dark"
            style={{ top: navbarHeight }}
          >
            <div className="mx-auto max-w-md space-y-1 p-4 pb-20">
              {/* Standalone items first */}
              {standalone.map((item) => (
                <Link
                  key={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-accent-emerald/10 text-accent-emerald"
                      : "text-slate-200 active:bg-white/10"
                  }`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.icon && <span className="text-lg">{item.icon}</span>}
                  {item.label}
                </Link>
              ))}

              {/* Grouped items */}
              {groups.map((group) => (
                <div key={group.label} className="pt-3">
                  <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {group.label}
                  </div>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors ${
                        pathname.startsWith(item.href)
                          ? "bg-accent-emerald/10 text-accent-emerald"
                          : "text-slate-200 active:bg-white/10"
                      }`}
                      href={item.href}
                      onClick={() => setOpen(false)}
                    >
                      {item.icon && <span className="text-lg">{item.icon}</span>}
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

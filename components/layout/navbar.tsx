import Link from "next/link";

import { Container } from "@/components/ui/container";
import { dashboardNav, marketingNav, siteConfig } from "@/lib/constants/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type NavbarProps = {
  mode?: "marketing" | "dashboard";
  userIdentity?: {
    displayName: string;
    initials: string;
  };
};

function Brand() {
  return (
    <Link className="flex items-center gap-2" href="/">
      <svg className="h-8 w-8 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.394 2.08a1 1 0 0 0-.788 0l-7 3a1 1 0 0 0 0 1.84l2.644 1.131a.999.999 0 0 1 .356-.257l4-1.714a1 1 0 1 1 .788 1.838L7.667 9.088l1.94.831a1 1 0 0 0 .787 0l7-3a1 1 0 0 0 0-1.838l-7-3Z" />
        <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 0 0-1.05-.174 1 1 0 0 1-.89-.89 11.115 11.115 0 0 1 .25-3.762Z" />
        <path d="M9.3 16.573A9.026 9.026 0 0 0 7 14.935v-3.957l1.818.78a3 3 0 0 0 2.364 0l5.508-2.361a11.026 11.026 0 0 1 .25 3.762 1 1 0 0 1-.89.89 8.968 8.968 0 0 0-5.35 2.524 1 1 0 0 1-1.4 0Z" />
        <path d="M6 18a1 1 0 0 0 1-1v-2.065a8.935 8.935 0 0 0-2-.712V17a1 1 0 0 0 1 1Z" />
      </svg>
      <span className="gradient-text font-display text-xl font-bold">{siteConfig.name}</span>
    </Link>
  );
}

export async function Navbar({ mode = "marketing", userIdentity }: NavbarProps) {
  const navItems = mode === "dashboard" ? dashboardNav : marketingNav;
  let marketingAuthHref = "/login";

  if (mode === "marketing") {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      marketingAuthHref = "/dashboard";
    }
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-surface-graphite/95 backdrop-blur-sm">
      <Container className="flex items-center justify-between py-4">
        <Brand />
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              className={`text-sm font-medium ${mode === "dashboard" && item.href === "/dashboard" ? "text-accent-emerald" : "text-slate-200 hover:text-accent-emerald"}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {mode === "marketing" ? (
          <div className="flex items-center gap-3">
            <Link className="ghost-button px-5 py-2.5 text-sm" href={marketingAuthHref}>
              Intră în cont
            </Link>
            <Link className="accent-button px-5 py-2.5 text-sm" href="/upgrade">
              Alătură-te Acum
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <div className="text-sm text-slate-400">Bine ai venit,</div>
              <div className="font-semibold text-white">{userIdentity?.displayName ?? "Membru"}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-emerald font-bold text-crypto-dark">
              {userIdentity?.initials ?? "M"}
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
}

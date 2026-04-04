import Link from "next/link";
import { headers } from "next/headers";

import { Container } from "@/components/ui/container";
import { dashboardNav, marketingNav, siteConfig } from "@/lib/constants/site";
import { MarketingDiscordButton } from "@/components/layout/marketing-discord-button";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAbsoluteHostUrl, getHostRole } from "@/lib/utils/host-routing";

type NavbarProps = {
  mode?: "marketing" | "dashboard";
  userIdentity?: {
    displayName: string;
    initials: string;
  };
};

function Brand({ href }: { href: string }) {
  return (
    <Link className="flex items-center gap-2 self-start md:self-auto" href={href}>
      <svg className="h-8 w-8 shrink-0 text-accent-emerald" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="gradient-text whitespace-nowrap font-display text-lg font-bold sm:text-xl">{siteConfig.name}</span>
        <span className="text-[10px] tracking-[0.15em] text-slate-500">by Alex Costea</span>
      </div>
    </Link>
  );
}

export async function Navbar({ mode = "marketing", userIdentity }: NavbarProps) {
  const navItems = mode === "dashboard" ? dashboardNav : marketingNav;
  const requestHeaders = headers();
  const hostRole = getHostRole(requestHeaders.get("host") ?? "");
  let marketingAuthHref = "/login";
  let marketingPrimaryHref = "/upgrade";
  let brandHref = "/";
  let dashboardHref = "/dashboard";
  let settingsHref = "/dashboard#setari";

  if (hostRole !== "local") {
    brandHref = getAbsoluteHostUrl("marketing", "/");
    dashboardHref = getAbsoluteHostUrl("app", "/dashboard");
    settingsHref = getAbsoluteHostUrl("app", "/dashboard#setari");
  }

  if (mode === "marketing") {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (hostRole !== "local") {
      marketingAuthHref = getAbsoluteHostUrl("app", user ? "/dashboard" : "/login");
      marketingPrimaryHref = getAbsoluteHostUrl("app", "/upgrade");
    } else if (user) {
      marketingAuthHref = "/dashboard";
    }
  }

  return (
    <nav
      aria-label={mode === "marketing" ? "Navigare principală publică" : "Navigare principală cont"}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-surface-graphite/95 backdrop-blur-sm"
    >
      <Container className={`py-2.5 md:py-4 ${mode === "marketing" ? "flex items-center justify-between" : "flex items-center justify-between"}`}>
        <Brand href={brandHref} />
        <div className="hidden items-center gap-6 lg:flex">
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
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:block">
              <MarketingDiscordButton href={siteConfig.discordUrl} />
            </div>
            <Link className="ghost-button flex items-center justify-center px-3 py-2 text-center text-xs md:px-5 md:py-3 md:text-sm" href={marketingAuthHref}>
              Intră în cont
            </Link>
            <Link className="accent-button flex items-center justify-center px-3 py-2 text-center text-xs md:px-5 md:py-3 md:text-sm" href={marketingPrimaryHref}>
              Alătură-te
            </Link>
          </div>
        ) : (
          <ProfileMenu
            dashboardHref={dashboardHref}
            displayName={userIdentity?.displayName ?? "Membru"}
            initials={userIdentity?.initials ?? "M"}
            settingsHref={settingsHref}
          />
        )}
      </Container>
    </nav>
  );
}

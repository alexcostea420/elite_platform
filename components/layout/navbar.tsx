import Link from "next/link";
import { headers } from "next/headers";

import { Container } from "@/components/ui/container";
import { dashboardNavGroups, dashboardNavStandalone, marketingNav, siteConfig } from "@/lib/constants/site";
import { MarketingDiscordButton } from "@/components/layout/marketing-discord-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavDropdown } from "@/components/layout/nav-dropdown";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { CommandSearchTrigger } from "@/components/ui/command-search";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAbsoluteHostUrl, getHostRole } from "@/lib/utils/host-routing";

type NavbarProps = {
  mode?: "marketing" | "dashboard";
  userIdentity?: {
    displayName: string;
    initials: string;
  };
  isAdmin?: boolean;
};

function Brand({ href }: { href: string }) {
  return (
    <Link className="flex items-center gap-2 self-start md:self-auto" href={href}>
      <span className="text-2xl">🪖</span>
      <div className="flex flex-col leading-tight">
        <span className="gradient-text whitespace-nowrap font-display text-lg font-bold sm:text-xl">{siteConfig.name}</span>
        <span className="text-[10px] tracking-[0.15em] text-slate-500">by Alex Costea</span>
      </div>
    </Link>
  );
}

export async function Navbar({ mode = "marketing", userIdentity, isAdmin = false }: NavbarProps) {
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
      aria-label={mode === "marketing" ? "Navigare principala publica" : "Navigare principala cont"}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-crypto-dark/95 backdrop-blur-sm"
    >
      <Container className="flex items-center justify-between py-2.5 md:py-4">
        <Brand href={brandHref} />

        {mode === "dashboard" ? (
          <>
            {/* Desktop: standalone links + dropdown groups */}
            <div className="hidden items-center gap-5 lg:flex">
              <Link
                className="text-sm font-medium text-accent-emerald"
                href="/dashboard"
              >
                Dashboard
              </Link>
              {dashboardNavGroups.map((group) => (
                <NavDropdown
                  key={group.label}
                  items={group.items}
                  label={group.label}
                />
              ))}
              <Link
                className="text-sm font-medium text-slate-200 hover:text-accent-emerald"
                href="/bots"
              >
                🤖 Bot
              </Link>
              <Link
                className="text-sm font-semibold text-accent-emerald hover:text-accent-soft"
                href="/upgrade"
              >
                Prelungeste
              </Link>
            </div>

            {/* Search + Mobile hamburger + profile */}
            <div className="flex items-center gap-2">
              <CommandSearchTrigger />
              <MobileNav
                groups={dashboardNavGroups}
                standalone={dashboardNavStandalone}
              />
              <ProfileMenu
                dashboardHref={dashboardHref}
                displayName={userIdentity?.displayName ?? "Membru"}
                initials={userIdentity?.initials ?? "M"}
                settingsHref={settingsHref}
                isAdmin={isAdmin}
              />
            </div>
          </>
        ) : (
          <>
            {/* Marketing desktop nav */}
            <div className="hidden items-center gap-6 lg:flex">
              {marketingNav.map((item) => (
                <Link
                  key={item.label}
                  className="text-sm font-medium text-slate-200 hover:text-accent-emerald"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden sm:block">
                <MarketingDiscordButton href={siteConfig.discordUrl} />
              </div>
              <Link className="ghost-button flex min-h-[36px] items-center justify-center whitespace-nowrap px-3 py-1.5 text-[11px] md:min-h-[44px] md:px-5 md:py-3 md:text-sm" href={marketingAuthHref}>
                Cont
              </Link>
              <Link className="accent-button flex min-h-[36px] items-center justify-center whitespace-nowrap px-3 py-1.5 text-[11px] md:min-h-[44px] md:px-5 md:py-3 md:text-sm" href={marketingPrimaryHref}>
                Intra
              </Link>
            </div>
          </>
        )}
      </Container>
    </nav>
  );
}

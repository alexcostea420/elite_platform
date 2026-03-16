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
      <svg className="h-8 w-8 shrink-0 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.394 2.08a1 1 0 0 0-.788 0l-7 3a1 1 0 0 0 0 1.84l2.644 1.131a.999.999 0 0 1 .356-.257l4-1.714a1 1 0 1 1 .788 1.838L7.667 9.088l1.94.831a1 1 0 0 0 .787 0l7-3a1 1 0 0 0 0-1.838l-7-3Z" />
        <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 0 0-1.05-.174 1 1 0 0 1-.89-.89 11.115 11.115 0 0 1 .25-3.762Z" />
        <path d="M9.3 16.573A9.026 9.026 0 0 0 7 14.935v-3.957l1.818.78a3 3 0 0 0 2.364 0l5.508-2.361a11.026 11.026 0 0 1 .25 3.762 1 1 0 0 1-.89.89 8.968 8.968 0 0 0-5.35 2.524 1 1 0 0 1-1.4 0Z" />
        <path d="M6 18a1 1 0 0 0 1-1v-2.065a8.935 8.935 0 0 0-2-.712V17a1 1 0 0 0 1 1Z" />
      </svg>
      <span className="gradient-text whitespace-nowrap font-display text-lg font-bold sm:text-xl">{siteConfig.name}</span>
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
      <Container className={`py-4 ${mode === "marketing" ? "flex flex-col gap-3 md:flex-row md:items-center md:justify-between" : "flex items-center justify-between"}`}>
        <Brand href={brandHref} />
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
          <div className="grid w-full grid-cols-3 gap-2 md:flex md:w-auto md:items-center md:gap-3">
            <MarketingDiscordButton href={siteConfig.discordUrl} />
            <Link className="ghost-button flex items-center justify-center px-3 py-2.5 text-center text-xs sm:text-sm md:px-5" href={marketingAuthHref}>
              Intră în cont
            </Link>
            <Link className="accent-button flex items-center justify-center px-3 py-2.5 text-center text-xs sm:text-sm md:px-5" href={marketingPrimaryHref}>
              Alătură-te Acum
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

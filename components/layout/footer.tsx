import Link from "next/link";

import { logoutAction } from "@/app/auth/actions";
import { Container } from "@/components/ui/container";
import { footerLinks, siteConfig } from "@/lib/constants/site";

type FooterProps = {
  compact?: boolean;
};

export function Footer({ compact = false }: FooterProps) {
  if (compact) {
    return (
      <footer className="mt-12 border-t border-white/5 bg-crypto-dark py-8">
        <Container className="text-center text-sm text-slate-400">
          <p className="mb-2">© 2026 {siteConfig.name} by {siteConfig.creator}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {footerLinks.dashboard
              .filter((link) => link.label !== "Logout")
              .map((link) => (
                <Link key={link.label} className="hover:text-accent-emerald" href={link.href}>
                  {link.label}
                </Link>
              ))}
            <form action={logoutAction}>
              <button className="hover:text-accent-emerald" type="submit">
                Logout
              </button>
            </form>
          </div>
        </Container>
      </footer>
    );
  }

  return (
    <footer className="border-t border-white/5 bg-crypto-dark px-4 py-12">
      <Container>
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">🪖</span>
              <div className="flex flex-col leading-tight">
                <span className="gradient-text font-display text-xl font-bold">{siteConfig.name}</span>
                <span className="text-[10px] tracking-[0.15em] text-slate-500">by Alex Costea</span>
              </div>
            </div>
            <p className="max-w-xl text-slate-400">
              Comunitate de trading crypto condusă de {siteConfig.creator}. Învață, crește și profită alături de traderi care vor claritate, disciplină și execuție reală.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                aria-label="Canal YouTube Armata de Traderi"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-slate-400 transition hover:border-accent-emerald/30 hover:bg-accent-emerald/10 hover:text-accent-emerald"
                href={siteConfig.youtubeUrl}
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                aria-label="Comunitate Discord Armata de Traderi"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-slate-400 transition hover:border-accent-emerald/30 hover:bg-accent-emerald/10 hover:text-accent-emerald"
                href={siteConfig.discordUrl}
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.42 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.335-.956 2.42-2.157 2.42zm7.974 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.335-.946 2.42-2.157 2.42z"/>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-accent-emerald">Link-uri Rapide</h4>
            <ul className="space-y-2 text-slate-400">
              {footerLinks.quick.map((link) => (
                <li key={link.label}>
                  <Link className="hover:text-accent-emerald" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-accent-emerald">Legal</h4>
            <ul className="space-y-2 text-slate-400">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("http") ? (
                    <a className="hover:text-accent-emerald" href={link.href} rel="noreferrer" target="_blank">
                      {link.label}
                    </a>
                  ) : (
                    <Link className="hover:text-accent-emerald" href={link.href}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-sm text-slate-500">
          <p className="mb-2">© 2026 {siteConfig.name} by {siteConfig.creator}. Toate drepturile rezervate.</p>
          <p className="text-xs text-slate-600">
            Costea Cristian-Alexandru PFA · CUI 54517198 ·{" "}
            <a className="hover:text-accent-emerald" href="mailto:contact@armatadetraderi.com">contact@armatadetraderi.com</a>
            {" · "}
            <Link className="hover:text-accent-emerald" href="/disclaimer">Disclaimer și Risc</Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}

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
      <footer className="mt-12 border-t border-white/10 bg-surface-graphite py-8">
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
    <footer className="border-t border-white/10 bg-surface-graphite px-4 py-12">
      <Container>
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <svg className="h-8 w-8 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 0 0-.788 0l-7 3a1 1 0 0 0 0 1.84l2.644 1.131a.999.999 0 0 1 .356-.257l4-1.714a1 1 0 1 1 .788 1.838L7.667 9.088l1.94.831a1 1 0 0 0 .787 0l7-3a1 1 0 0 0 0-1.838l-7-3Z" />
                <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 0 0-1.05-.174 1 1 0 0 1-.89-.89 11.115 11.115 0 0 1 .25-3.762Z" />
                <path d="M9.3 16.573A9.026 9.026 0 0 0 7 14.935v-3.957l1.818.78a3 3 0 0 0 2.364 0l5.508-2.361a11.026 11.026 0 0 1 .25 3.762 1 1 0 0 1-.89.89 8.968 8.968 0 0 0-5.35 2.524 1 1 0 0 1-1.4 0Z" />
                <path d="M6 18a1 1 0 0 0 1-1v-2.065a8.935 8.935 0 0 0-2-.712V17a1 1 0 0 0 1 1Z" />
              </svg>
              <span className="gradient-text font-display text-xl font-bold">{siteConfig.name}</span>
            </div>
            <p className="max-w-xl text-slate-400">
              Comunitate de trading crypto condusă de {siteConfig.creator}. Învață, crește și profită alături de traderi care vor claritate, disciplină și execuție reală.
            </p>
            <div className="mt-4 flex gap-4 text-2xl">
              <a className="text-slate-400 hover:text-accent-emerald" href={siteConfig.youtubeUrl}>📺</a>
              <a className="text-slate-400 hover:text-accent-emerald" href={siteConfig.discordUrl}>💬</a>
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
                  <a className="hover:text-accent-emerald" href={link.href} rel={link.href.startsWith("http") ? "noreferrer" : undefined} target={link.href.startsWith("http") ? "_blank" : undefined}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-sm text-slate-500">
          <p className="mb-2">© 2026 {siteConfig.name} by {siteConfig.creator}. Toate drepturile rezervate.</p>
          <p className="text-red-400">⚠️ <strong>Disclaimer:</strong> Acest website nu oferă sfaturi financiare. Trading-ul crypto implică riscuri. Investește responsabil.</p>
        </div>
      </Container>
    </footer>
  );
}

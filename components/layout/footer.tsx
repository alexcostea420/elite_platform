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
            <div className="mt-4 flex gap-4 text-2xl">
              <a
                aria-label="Canal YouTube Armata de Traderi"
                className="text-slate-400 hover:text-accent-emerald"
                href={siteConfig.youtubeUrl}
                rel="noreferrer"
                target="_blank"
              >
                📺
              </a>
              <a
                aria-label="Comunitate Discord Armata de Traderi"
                className="text-slate-400 hover:text-accent-emerald"
                href={siteConfig.discordUrl}
                rel="noreferrer"
                target="_blank"
              >
                💬
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
          <p className="mb-2">Costea Cristian-Alexandru PFA | CUI: 54517198 | F2026020803003 | B-dul Bucureștii Noi 136, parter, ap. 5, Sector 1, București | contact@armatadetraderi.com</p>
          <div className="max-w-2xl mx-auto text-xs text-slate-600 space-y-2">
            <p>
              <strong className="text-red-400/80">Disclaimer financiar:</strong> Armata de Traderi nu oferă sfaturi financiare personalizate și nu este autorizată de ASF.
            </p>
            <p>
              Tot conținutul are caracter exclusiv educațional. Tranzacționarea criptomonedelor implică riscuri semnificative, inclusiv pierderea totală a capitalului.
            </p>
            <p>
              Performanțele trecute nu garantează rezultate viitoare. Utilizatorul este singurul responsabil pentru deciziile sale de investiție.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

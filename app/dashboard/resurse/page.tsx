import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Resurse Elite | Ghiduri, Indicatori și Instrumente",
  description: "Toate resursele de care ai nevoie: ghiduri, indicatori TradingView, chart-uri, risk management și mai mult.",
  keywords: ["resurse trading", "ghiduri trading", "indicatori tradingview", "elite resurse"],
  path: "/dashboard/resurse",
  host: "app",
  index: false,
});

type ResourceCard = {
  icon: string;
  title: string;
  description: string;
  links: { label: string; href: string; external?: boolean }[];
  tag?: string;
};

const resources: ResourceCard[] = [
  {
    icon: "📖",
    title: "Ghid Complet — Start Rapid",
    description: "Primul lucru pe care trebuie să-l vezi. Ghidul complet de la 0 la trading real.",
    tag: "OBLIGATORIU",
    links: [
      { label: "Deschide Ghidul (Video)", href: "https://youtu.be/oF8nBLQmvkI", external: true },
    ],
  },
  {
    icon: "📊",
    title: "Indicatori Elite TradingView",
    description: "4 indicatori exclusivi pentru analiza tehnică. Instalează-i pe TradingView.",
    links: [
      { label: "Elite Bands", href: "https://www.tradingview.com/script/5khlHMXt-Elite-Bands/", external: true },
      { label: "Elite Momentum", href: "https://www.tradingview.com/script/AdER6U74-Elite-Momentum/", external: true },
      { label: "Elite Levels", href: "https://www.tradingview.com/script/HAt7SrgD-Elite-Levels/", external: true },
      { label: "Elite Fib Zones", href: "https://www.tradingview.com/script/FCvrNntd-Elite-Fib-Zones/", external: true },
      { label: "Vezi pagina Indicatori", href: "/dashboard/indicators" },
    ],
  },
  {
    icon: "🎯",
    title: "Lot Size — CEL MAI IMPORTANT Video",
    description: "Fără lot size corect, poți avea 70% win rate și tot să pierzi bani. Uită-te OBLIGATORIU.",
    tag: "ESENȚIAL",
    links: [
      { label: "Deschide Video-ul", href: "https://youtu.be/4tNSs6egoM0", external: true },
    ],
  },
  {
    icon: "📈",
    title: "Chart-uri și Watchlist",
    description: "Chart-urile lui Alex pe TradingView + lista de monede urmărite.",
    links: [
      { label: "Chart-urile Alex", href: "https://www.tradingview.com/chart/b4fwTsyx", external: true },
      { label: "Watchlist Monede", href: "https://www.tradingview.com/watchlists/206110009/", external: true },
    ],
  },
  {
    icon: "⚙️",
    title: "Setup TradingView",
    description: "Cum îți configurezi TradingView corect — timezone România, layout, indicatori.",
    links: [
      { label: "Tutorial Setup (Varianta Gratis)", href: "https://youtu.be/K4lIYkutU58", external: true },
      { label: "Tutorial Setup (TradingView Platit)", href: "https://youtu.be/shjwxsS9S8", external: true },
    ],
  },
  {
    icon: "🛡️",
    title: "Risk Management",
    description: "Regulile de bază pentru risk management + exemple de portofoliu. Document detaliat.",
    links: [
      { label: "Deschide Documentul", href: "https://docs.google.com/document/d/1AhDI0lXxfVL8IzCqxGga7Tp6QMnrlgtnloUlplNND1s/edit?usp=sharing", external: true },
    ],
  },
  {
    icon: "🎥",
    title: "Playlist Educațional Complet",
    description: "Toate video-urile educaționale într-un singur loc. De la baze la strategii avansate.",
    links: [
      { label: "Playlist Complet (55+ video-uri)", href: "https://youtube.com/playlist?list=PLAgmyeArliWVzlt55d3BnGTbnOJh2PUf2", external: true },
      { label: "Jocul De Lichiditate", href: "https://www.youtube.com/watch?v=cX2_1D35bR8&list=PLAgmyeArliWVzlt55d3BnGTbnOJh2PUf2", external: true },
      { label: "Biblioteca Video pe Site", href: "/dashboard/videos" },
    ],
  },
  {
    icon: "💱",
    title: "Exchange Recomandat",
    description: "MEXC — exchange recomandat pentru tradingul de crypto. Link de referral cu beneficii.",
    links: [
      { label: "Creează Cont MEXC", href: "https://promote.mexc.com/a/GxbgCLhX", external: true },
    ],
  },
  {
    icon: "🕐",
    title: "Timezone România",
    description: "Setare corectă a timezone-ului pe TradingView pentru sesiunile de trading.",
    links: [
      { label: "UTC+3 (ora României)", href: "https://www.tradingview.com", external: true },
    ],
  },
];

export default async function ResursePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/resurse");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_tier !== "elite") redirect("/upgrade");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Header */}
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/dashboard">Dashboard</Link>
              <span className="text-slate-600">/</span>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Resurse</p>
            </div>
            <h1 className="text-4xl font-bold text-white">
              Resurse <span className="gradient-text">Elite</span>
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Tot ce ai nevoie într-un singur loc: ghiduri, indicatori, chart-uri, risk management și instrumente de trading.
            </p>
          </section>

          {/* Resource Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((res) => (
              <article key={res.title} className="panel flex flex-col p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 text-2xl">
                      {res.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white">{res.title}</h3>
                  </div>
                  {res.tag && (
                    <span className="shrink-0 rounded-full bg-accent-emerald/10 px-3 py-1 text-xs font-bold text-accent-emerald">
                      {res.tag}
                    </span>
                  )}
                </div>
                <p className="mb-5 flex-1 text-sm text-slate-400">{res.description}</p>
                <div className="flex flex-wrap gap-2">
                  {res.links.map((link) => (
                    link.external ? (
                      <a
                        key={link.label}
                        className="ghost-button text-xs"
                        href={link.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link.label} ↗
                      </a>
                    ) : (
                      <Link
                        key={link.label}
                        className="ghost-button text-xs"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    )
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}

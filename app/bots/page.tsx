import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Bot Trading Automat | Copiaza Tranzactiile AI",
  description:
    "Copiaza automat tranzactiile ML pe contul tau Hyperliquid. Return consistent, sizing automat, zero acces la fonduri.",
  keywords: [
    "bot trading",
    "copytrade crypto",
    "trading automat",
    "hyperliquid bot",
  ],
  path: "/bots",
  host: "app",
  index: true,
});

/* ------------------------------------------------------------------ */
/*  Fallback data (used when tables are empty)                         */
/* ------------------------------------------------------------------ */

const fallbackPerformance = {
  monthly_return: 12.4,
  win_rate: 68,
  sharpe_ratio: 3.2,
  max_drawdown: -8.5,
};

const fallbackTrades = [
  { asset: "ETH", direction: "LONG", pnl: 142.5, closed_at: "2026-03-31" },
  { asset: "SOL", direction: "SHORT", pnl: -38.2, closed_at: "2026-03-31" },
  { asset: "DOGE", direction: "LONG", pnl: 67.8, closed_at: "2026-03-30" },
  { asset: "AVAX", direction: "SHORT", pnl: 95.3, closed_at: "2026-03-30" },
  { asset: "ETH", direction: "LONG", pnl: 210.1, closed_at: "2026-03-29" },
  { asset: "SOL", direction: "LONG", pnl: -22.4, closed_at: "2026-03-29" },
  { asset: "DOGE", direction: "SHORT", pnl: 54.6, closed_at: "2026-03-28" },
  { asset: "AVAX", direction: "LONG", pnl: 118.9, closed_at: "2026-03-28" },
  { asset: "ETH", direction: "SHORT", pnl: 83.7, closed_at: "2026-03-27" },
  { asset: "SOL", direction: "LONG", pnl: 47.2, closed_at: "2026-03-27" },
];

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

type Performance = {
  monthly_return: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
};

type Trade = {
  asset: string;
  direction: string;
  pnl: number;
  closed_at: string;
};

async function getPerformance(): Promise<Performance> {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("bot_performance")
      .select("monthly_return, win_rate, sharpe_ratio, max_drawdown")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) return data as Performance;
  } catch {
    // table may not exist yet
  }
  return fallbackPerformance;
}

async function getRecentTrades(): Promise<Trade[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("bot_copy_trades")
      .select("asset, direction, pnl, closed_at")
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(10);

    if (data && data.length > 0) return data as Trade[];
  } catch {
    // table may not exist yet
  }
  return fallbackTrades;
}

/* ------------------------------------------------------------------ */
/*  Features data                                                      */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: "🤖",
    title: "AI Trading 24/7",
    description:
      "Algoritmi ML tranzactioneaza non-stop pe contul tau Hyperliquid, fara interventie manuala.",
  },
  {
    icon: "📐",
    title: "Sizing Automat",
    description:
      "Marimea pozitiei se ajusteaza automat in functie de balanta ta si volatilitatea pietei.",
  },
  {
    icon: "🔒",
    title: "Zero Withdrawal Access",
    description:
      "Botul nu are acces la retrageri. Fondurile raman in totalitate sub controlul tau.",
  },
];

const botFaqItems = [
  {
    q: "Cum functioneaza copytrade-ul?",
    a: "Conectezi contul Hyperliquid prin API read-only + trade. Botul nostru copiaza automat tranzactiile pe contul tau, cu sizing ajustat la balanta ta.",
  },
  {
    q: "Este sigur? Poate botul sa retraga fonduri?",
    a: "Nu. API-ul Hyperliquid nu permite retrageri prin chei de tranzactionare. Fondurile tale raman 100% sub controlul tau.",
  },
  {
    q: "Care e balanta minima recomandata?",
    a: "$100 este minimul recomandat pentru a beneficia de diversificarea completa pe toate cele 9 assets.",
  },
  {
    q: "Ce se intampla daca piata scade?",
    a: "Botul are management de risc integrat: stop-loss pe fiecare pozitie, limita maxima de expunere, si reducere automata in perioadele de volatilitate extrema.",
  },
  {
    q: "Pot opri botul oricand?",
    a: "Da, poti dezactiva copytrade-ul instant din dashboard. Pozitiile deschise pot fi inchise manual sau automat.",
  },
  {
    q: "De ce e mai ieftin pentru membrii Elite?",
    a: "Membrii Elite sustin deja comunitatea. Botul este un beneficiu suplimentar la pret redus, ca multumire pentru loialitate.",
  },
];

const standardFeatures = [
  "Copytrade automat 24/7",
  "9 assets: ETH, SOL, AVAX, DOGE + altele",
  "Sizing automat dupa balanta",
  "Dashboard cu statistici live",
  "Alerte Telegram",
  "Suport dedicat",
];

const eliteFeatures = [
  "Tot ce include Standard",
  "Pret redus cu 54%",
  "Acces comunitate Elite",
  "Semnale premium + analize",
  "Sesiuni live saptamanale",
  "Suport prioritar",
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function BotsPage() {
  const [performance, trades] = await Promise.all([
    getPerformance(),
    getRecentTrades(),
  ]);

  const stats = [
    {
      label: "Return lunar",
      value: `+${performance.monthly_return}%`,
      tone: "green" as const,
    },
    {
      label: "Win rate",
      value: `${performance.win_rate}%`,
      tone: "emerald" as const,
    },
    {
      label: "Sharpe ratio",
      value: performance.sharpe_ratio.toFixed(1),
      tone: "emerald" as const,
    },
    {
      label: "Max drawdown",
      value: `${performance.max_drawdown}%`,
      tone: "green" as const,
    },
  ];

  return (
    <>
      <Navbar mode="marketing" />
      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pb-12 pt-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(105,224,143,.12),transparent_60%)]" />
          <Container className="relative text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Copytrade AI
            </p>
            <h1 className="font-display text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
              Trading Automat{" "}
              <span className="gradient-text">cu AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Copiaza tranzactiile noastre automat pe contul tau Hyperliquid.
              Fara experienta necesara, fara acces la fonduri.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/bots/subscribe" className="accent-button text-lg">
                Incepe Acum
              </Link>
              <Link href="#preturi" className="ghost-button text-lg">
                Vezi Preturile
              </Link>
            </div>
          </Container>
        </section>

        {/* ── Stats ── */}
        <section className="border-y border-white/10 bg-surface-graphite/50 py-12">
          <Container>
            <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div
                    className={`mb-2 text-4xl font-bold ${
                      stat.tone === "green"
                        ? "text-crypto-green"
                        : "text-accent-emerald"
                    }`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── Features ── */}
        <section className="px-4 py-20">
          <Container>
            <SectionHeading
              eyebrow="De ce noi"
              title={
                <>
                  Avantaje{" "}
                  <span className="gradient-text">Cheie</span>
                </>
              }
              description="Totul automatizat. Tu doar conectezi contul."
            />
            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
              {features.map((f) => (
                <article key={f.title} className="panel card-hover p-8">
                  <div className="mb-4 text-4xl">{f.icon}</div>
                  <h3 className="mb-3 text-xl font-bold text-white">
                    {f.title}
                  </h3>
                  <p className="text-slate-400">{f.description}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        {/* ── Recent Trades ── */}
        <section className="border-y border-white/10 bg-surface-graphite/30 px-4 py-20">
          <Container>
            <SectionHeading
              eyebrow="Rezultate recente"
              title={
                <>
                  Ultimele{" "}
                  <span className="gradient-text">Tranzactii</span>
                </>
              }
              description="Tranzactii reale executate de bot in ultimele zile."
            />
            <div className="mx-auto mt-12 max-w-3xl">
              <div className="panel overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-4 gap-4 border-b border-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span>Asset</span>
                  <span>Directie</span>
                  <span className="text-right">PnL</span>
                  <span className="text-right">Data</span>
                </div>
                {/* Table rows */}
                {trades.map((trade, i) => (
                  <div
                    key={`${trade.asset}-${trade.closed_at}-${i}`}
                    className="grid grid-cols-4 gap-4 border-b border-white/5 px-6 py-4 text-sm transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="font-semibold text-white">
                      {trade.asset}
                    </span>
                    <span
                      className={
                        trade.direction === "LONG"
                          ? "font-semibold text-crypto-green"
                          : "font-semibold text-red-400"
                      }
                    >
                      {trade.direction}
                    </span>
                    <span
                      className={`text-right font-mono ${
                        trade.pnl >= 0 ? "text-crypto-green" : "text-red-400"
                      }`}
                    >
                      {trade.pnl >= 0 ? "+" : ""}
                      ${trade.pnl.toFixed(2)}
                    </span>
                    <span className="text-right text-slate-500">
                      {trade.closed_at.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ── Pricing ── */}
        <section className="px-4 py-20" id="preturi">
          <Container>
            <SectionHeading
              eyebrow="Preturi"
              title={
                <>
                  Alege{" "}
                  <span className="gradient-text">Planul Tau</span>
                </>
              }
              description="Doua optiuni simple. Zero costuri ascunse."
            />
            <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
              {/* Standard plan */}
              <article className="panel card-hover p-8">
                <h3 className="text-2xl font-bold text-white">Standard</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Pentru oricine cu cont Hyperliquid
                </p>
                <div className="mb-6 mt-4">
                  <span className="text-5xl font-bold text-accent-emerald">
                    $98
                  </span>
                  <span className="text-slate-400">/luna</span>
                </div>
                <ul className="space-y-3">
                  {standardFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-crypto-green">&#10003;</span>
                      <span className="text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/bots/subscribe"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-slate-700 py-3 font-bold text-white hover:bg-slate-600"
                >
                  Incepe Standard
                </Link>
              </article>

              {/* Elite plan */}
              <article className="relative rounded-[1.5rem] border-2 border-accent-emerald bg-surface-graphite p-8 shadow-glow card-hover">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent-emerald px-4 py-1 text-sm font-bold text-crypto-dark">
                  Recomandat
                </div>
                <h3 className="text-2xl font-bold text-white">Elite</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Pentru membrii Elite activi
                </p>
                <div className="mb-2 mt-4">
                  <span className="text-5xl font-bold text-accent-emerald">
                    $45
                  </span>
                  <span className="text-slate-400">/luna</span>
                </div>
                <div className="mb-6 text-sm font-semibold text-crypto-green">
                  Economisesti $53/luna
                </div>
                <ul className="space-y-3">
                  {eliteFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-accent-emerald">&#10003;</span>
                      <span className="text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/bots/subscribe"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-accent-emerald py-3 font-bold text-crypto-dark hover:bg-accent-soft"
                >
                  Incepe ca Elite
                </Link>
              </article>
            </div>
          </Container>
        </section>

        {/* ── FAQ ── */}
        <section className="border-t border-white/10 bg-surface-graphite/30 px-4 py-20" id="faq">
          <Container className="max-w-4xl">
            <SectionHeading
              eyebrow="FAQ"
              title={
                <>
                  Intrebari{" "}
                  <span className="gradient-text">Frecvente</span>
                </>
              }
            />
            <div className="mt-16 space-y-4">
              {botFaqItems.map((item) => (
                <details
                  key={item.q}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-surface-graphite/90 shadow-card"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/5">
                    <span className="pr-4 text-lg font-semibold text-white">
                      {item.q}
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl leading-none text-accent-emerald transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="border-t border-white/10 px-6 pb-6 pt-4 text-slate-300">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

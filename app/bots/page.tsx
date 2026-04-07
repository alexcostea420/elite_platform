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
  title: "Bot Trading Automat | Tranzactioneaza Non-Stop",
  description:
    "Bot de trading automat care tranzactioneaza pentru tine, 24/7. Return consistent, sizing automat, zero acces la fonduri.",
  keywords: [
    "bot trading",
    "copytrade crypto",
    "trading automat",
    "bot AI trading",
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
  // Bot is Coming Soon - show placeholder
  return (
    <>
      <Navbar mode="marketing" />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <section className="panel mx-auto max-w-2xl p-8 text-center md:p-12">
            <div className="mb-4 text-5xl">🤖</div>
            <h1 className="text-3xl font-bold text-white">Bot Trading AI</h1>
            <h2 className="mt-2 text-xl font-semibold text-accent-emerald">Coming Soon</h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">
              Un bot care tranzactioneaza pentru tine, non-stop. Tu setezi riscul, el executa.
            </p>
            <p className="mt-6 text-sm text-slate-500">
              Membrii Elite vor primi acces prioritar si pret redus. Intra in comunitate ca sa fii primul care afla.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link className="accent-button px-6 py-3" href="/upgrade">
                Intra in Elite
              </Link>
              <Link className="ghost-button px-6 py-3" href="/">
                Inapoi acasa
              </Link>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );

}

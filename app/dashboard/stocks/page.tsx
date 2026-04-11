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
  title: "Stocks Tracker | Targets Elite",
  description: "Portofoliu stocks cu zone de Buy si Sell, semnale live. Exclusiv membrii Elite.",
  keywords: ["stocks tracker", "buy sell zones", "targets elite", "portofoliu actiuni"],
  path: "/dashboard/stocks",
  host: "app",
  index: false,
});

export const revalidate = 300;

type Stock = {
  ticker: string;
  currentPrice: number;
  buy1: number;
  buy2: number;
  sell1: number;
  sell2: number;
  high52w: number;
  pctFromATH: number;
  signal: string;
};

const stocks: Stock[] = [
  { ticker: "TSLA", currentPrice: 360.59, buy1: 350, buy2: 280, sell1: 580, sell2: 677, high52w: 498.8, pctFromATH: -27.71, signal: "HOLD" },
  { ticker: "COIN", currentPrice: 171.46, buy1: 118, buy2: 86, sell1: 450, sell2: 690, high52w: 444.7, pctFromATH: -61.44, signal: "HOLD" },
  { ticker: "HOOD", currentPrice: 68.90, buy1: 33, buy2: 23, sell1: 150, sell2: 250, high52w: 153.9, pctFromATH: -55.22, signal: "HOLD" },
  { ticker: "MSTR", currentPrice: 119.83, buy1: 105, buy2: 75, sell1: 800, sell2: 1150, high52w: 457.2, pctFromATH: -73.79, signal: "HOLD" },
  { ticker: "MARA", currentPrice: 8.71, buy1: 7, buy2: 5, sell1: 22, sell2: 56, high52w: 23.5, pctFromATH: -62.86, signal: "HOLD" },
  { ticker: "CRCL", currentPrice: 90.26, buy1: 45, buy2: 31, sell1: 230, sell2: 350, high52w: 299.0, pctFromATH: -69.81, signal: "HOLD" },
  { ticker: "GOOG", currentPrice: 294.46, buy1: 240, buy2: 210, sell1: 275, sell2: 410, high52w: 350.2, pctFromATH: -15.90, signal: "SELL 1" },
  { ticker: "META", currentPrice: 574.46, buy1: 550, buy2: 350, sell1: 850, sell2: 1000, high52w: 796.3, pctFromATH: -27.85, signal: "HOLD" },
  { ticker: "NVDA", currentPrice: 177.39, buy1: 150, buy2: 130, sell1: 250, sell2: 300, high52w: 212.2, pctFromATH: -16.40, signal: "HOLD" },
  { ticker: "AAPL", currentPrice: 255.92, buy1: 205, buy2: 170, sell1: 300, sell2: 350, high52w: 288.6, pctFromATH: -11.33, signal: "HOLD" },
  { ticker: "MSFT", currentPrice: 373.46, buy1: 390, buy2: 345, sell1: 650, sell2: 700, high52w: 555.5, pctFromATH: -32.76, signal: "BUY 1" },
  { ticker: "AMZN", currentPrice: 209.77, buy1: 184, buy2: 167, sell1: 350, sell2: 400, high52w: 258.6, pctFromATH: -18.88, signal: "HOLD" },
  { ticker: "PYPL", currentPrice: 45.34, buy1: 33, buy2: 30, sell1: 80, sell2: 180, high52w: 79.5, pctFromATH: -42.97, signal: "HOLD" },
  { ticker: "SHOP", currentPrice: 118.25, buy1: 110, buy2: 70, sell1: 180, sell2: 360, high52w: 182.2, pctFromATH: -35.10, signal: "HOLD" },
  { ticker: "PLTR", currentPrice: 148.46, buy1: 63, buy2: 45, sell1: 400, sell2: 500, high52w: 207.5, pctFromATH: -28.46, signal: "HOLD" },
  { ticker: "ORCL", currentPrice: 146.38, buy1: 150, buy2: 110, sell1: 260, sell2: 440, high52w: 345.7, pctFromATH: -57.66, signal: "BUY 1" },
];

function getSignalStyle(signal: string) {
  if (signal.includes("BUY")) return { color: "text-green-400", bg: "bg-green-400/10 border-green-400/30", icon: "🟢" };
  if (signal.includes("SELL")) return { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", icon: "🟠" };
  return { color: "text-slate-400", bg: "bg-white/5 border-white/10", icon: "⚪" };
}

function formatPrice(n: number) {
  return n >= 1000 ? `$${n.toLocaleString("en-US")}` : `$${n.toFixed(2)}`;
}

function getPricePosition(current: number, buy2: number, sell2: number) {
  const range = sell2 - buy2;
  if (range <= 0) return 50;
  const pos = ((current - buy2) / range) * 100;
  return Math.max(2, Math.min(98, pos));
}

export default async function StocksPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/stocks");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_tier !== "elite") redirect("/upgrade");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  const buySignals = stocks.filter((s) => s.signal.includes("BUY")).length;
  const sellSignals = stocks.filter((s) => s.signal.includes("SELL")).length;
  const holdSignals = stocks.filter((s) => s.signal === "HOLD").length;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/dashboard">Dashboard</Link>
              <span className="text-slate-600">/</span>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Stocks Tracker</p>
            </div>
            <h1 className="text-4xl font-bold text-white">
              Portofoliu <span className="gradient-text">Stocks</span>
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Zone de Buy si Sell pentru actiuni tech + crypto stocks. Targets setate de Alex.
            </p>
            <p className="mt-2 text-xs text-slate-600">Ultima actualizare: {new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}</p>
          </section>

          {/* Signal summary */}
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <article className="glass-card px-5 py-6 text-center">
              <div className="mb-2 text-2xl">🟢</div>
              <h3 className="font-mono text-4xl font-bold text-accent-emerald">{buySignals}</h3>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent-emerald/70">Buy Signals</p>
            </article>
            <article className="glass-card px-5 py-6 text-center">
              <div className="mb-2 text-2xl">⚪</div>
              <h3 className="font-mono text-4xl font-bold text-slate-400">{holdSignals}</h3>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Hold</p>
            </article>
            <article className="glass-card px-5 py-6 text-center">
              <div className="mb-2 text-2xl">🟠</div>
              <h3 className="font-mono text-4xl font-bold text-orange-400">{sellSignals}</h3>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-orange-400/70">Sell Signals</p>
            </article>
          </section>

          {/* Stocks table */}
          <section className="panel overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="sticky left-0 z-10 bg-surface-graphite px-5 py-4">Ticker</th>
                  <th className="px-5 py-4 font-mono">Pret</th>
                  <th className="px-5 py-4 font-mono">Buy 1</th>
                  <th className="px-5 py-4 font-mono">Buy 2</th>
                  <th className="px-5 py-4 font-mono">Sell 1</th>
                  <th className="px-5 py-4 font-mono">Sell 2</th>
                  <th className="px-5 py-4 font-mono">% ATH</th>
                  <th className="px-5 py-4">Semnal</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const style = getSignalStyle(stock.signal);
                  const pos = getPricePosition(stock.currentPrice, stock.buy2, stock.sell2);

                  return (
                    <tr key={stock.ticker} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                      <td className="sticky left-0 z-10 bg-surface-graphite px-5 py-4">
                        <span className="font-bold text-white">{stock.ticker}</span>
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-white">{formatPrice(stock.currentPrice)}</td>
                      <td className="px-5 py-4 font-mono text-green-400">{formatPrice(stock.buy1)}</td>
                      <td className="px-5 py-4 font-mono text-green-400/60">{formatPrice(stock.buy2)}</td>
                      <td className="px-5 py-4 font-mono text-orange-400">{formatPrice(stock.sell1)}</td>
                      <td className="px-5 py-4 font-mono text-orange-400/60">{formatPrice(stock.sell2)}</td>
                      <td className="px-5 py-4">
                        <span className={stock.pctFromATH > -20 ? "text-yellow-400" : "text-red-400"}>
                          {stock.pctFromATH.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${style.bg} ${style.color}`}>
                          {style.icon} {stock.signal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Price position bars */}
          <section className="mt-8">
            <h2 className="mb-5 text-xl font-bold text-white">Pozitie in Range (Buy 2 - Sell 2)</h2>
            <div className="space-y-3">
              {stocks.map((stock) => {
                const pos = getPricePosition(stock.currentPrice, stock.buy2, stock.sell2);
                const style = getSignalStyle(stock.signal);
                return (
                  <div key={stock.ticker + "-bar"} className="panel px-5 py-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-bold text-white">{stock.ticker}</span>
                      <span className={style.color}>{formatPrice(stock.currentPrice)}</span>
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                      <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 via-slate-500 to-orange-500 opacity-30" style={{ width: "100%" }} />
                      <div
                        className="absolute top-0 h-full w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                        style={{ left: `${pos}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                      <span>Buy 2: {formatPrice(stock.buy2)}</span>
                      <span>Sell 2: {formatPrice(stock.sell2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <p className="mt-8 text-center text-xs text-slate-600">
            Datele sunt orientative si nu constituie sfaturi de investitii. Targets setate de Alex Costea.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}

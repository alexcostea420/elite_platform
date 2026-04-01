import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { pricingPlans } from "@/lib/constants/site";
import { buildPageMetadata, getUpgradeOfferSchema } from "@/lib/seo";
import { BotSmartCta } from "@/components/upgrade/bot-smart-cta";

const comparisonRows = [
  {
    label: "Biblioteca video",
    free: "Selecție gratuită",
    elite: "Acces complet",
  },
  {
    label: "Analize premium",
    free: "Doar preview",
    elite: "Incluse integral",
  },
  {
    label: "Sesiuni live",
    free: "Nu",
    elite: "Da",
  },
  {
    label: "Discord Elite",
    free: "Acces limitat",
    elite: "Acces complet",
  },
  {
    label: "Suport prioritar",
    free: "Nu",
    elite: "Da",
  },
];

const planSlugMap: Record<string, string> = {
  "30 Zile": "elite_monthly",
  "3 Luni": "elite_3mo",
  "12 Luni": "elite_annual",
};

const botFeatures = [
  "20 Strategii ML (LightGBM + XGBoost)",
  "9 Assets: ETH, SOL, AVAX, DOGE + altele",
  "Execuție automată în timp real",
  "Alerte Telegram instant",
  "Managementul riscului integrat",
  "Dashboard cu statistici live",
];

export const metadata: Metadata = buildPageMetadata({
  title: "Abonament Trading Crypto | Prețuri Elite România",
  description:
    "Vezi prețurile pentru abonamentul Elite Trading Crypto și alege planul potrivit pentru comunitatea crypto, analize live și educație trading.",
  keywords: [
    "abonament trading crypto",
    "pret comunitate crypto",
    "plan trading romania",
    "discord elite trading",
    "preturi elite trading",
    "educatie trading crypto",
  ],
  path: "/upgrade",
  host: "app",
});

export default function UpgradePage() {
  const offerSchema = getUpgradeOfferSchema();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
        type="application/ld+json"
      />
      <Navbar mode="marketing" />
      <main className="pb-20 pt-28">
        <Container>
          <section className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Upgrade la Elite
            </p>
            <h1 className="text-4xl font-bold text-white md:text-6xl">
              Deblochează <span className="gradient-text">experiența completă</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-slate-300">
              Treci de la contul Free la Elite și obține acces la biblioteca video completă, analize premium, sesiuni live și suport prioritar în comunitate.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link className="accent-button px-8 py-4 text-lg font-bold" href="#planuri">
                Vezi ofertele Elite
              </Link>
              <Link className="ghost-button px-8 py-4 text-lg font-bold" href="/dashboard/videos">
                Explorează conținutul gratuit
              </Link>
            </div>
          </section>

          <section className="mb-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="panel p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white">Free vs Elite</h2>
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] bg-white/5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <div className="px-4 py-4">Acces</div>
                  <div className="px-4 py-4 text-center">Free</div>
                  <div className="px-4 py-4 text-center text-accent-emerald">Elite</div>
                </div>
                {comparisonRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[1.2fr_0.9fr_0.9fr] border-t border-white/10 text-sm">
                    <div className="px-4 py-4 text-slate-200">{row.label}</div>
                    <div className="px-4 py-4 text-center text-slate-400">{row.free}</div>
                    <div className="px-4 py-4 text-center font-semibold text-accent-emerald">{row.elite}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel p-6 md:p-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Ce deblochezi
              </p>
              <h2 className="text-2xl font-bold text-white">Tot ce ai nevoie pentru execuție reală</h2>
              <div className="mt-6 space-y-4">
                {[
                  "Biblioteca video completă, structurată pe setup-uri și contexte reale",
                  "Analize premium cu niveluri importante și context clar de piață",
                  "Sesiuni live recurente și acces în Discord Elite",
                  "Suport prioritar și răspunsuri mai rapide în comunitate",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 text-accent-emerald">✓</span>
                      <p className="text-slate-300">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mb-10" id="planuri">
            <h2 className="mb-6 text-center text-3xl font-bold text-white">Alege durata de acces</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {pricingPlans.map((plan) => (
                <article key={plan.name} className={`relative rounded-[1.5rem] p-8 ${plan.highlighted ? "card-hover border-2 border-accent-emerald bg-surface-graphite shadow-glow" : "panel card-hover"}`}>
                  {plan.badge ? <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent-emerald px-4 py-1 text-sm font-bold text-crypto-dark">{plan.badge}</div> : null}
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <div className="mb-6 mt-3">
                    <span className="text-5xl font-bold text-accent-emerald">{plan.price}</span>
                    {plan.period ? <span className="text-slate-400">{plan.period}</span> : null}
                    <div className="mt-1 text-sm text-slate-500">{plan.details}</div>
                    {plan.savings ? <div className="mt-2 text-sm font-semibold text-crypto-green">{plan.savings}</div> : null}
                  </div>
                  <ul className="space-y-3">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-slate-300">
                        <span className="text-crypto-green">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-xl py-3 font-bold ${plan.highlighted ? "bg-accent-emerald text-crypto-dark hover:bg-accent-soft" : "bg-slate-700 text-white hover:bg-slate-600"}`}
                    href={`/upgrade/pay?plan=${planSlugMap[plan.name] ?? "elite_monthly"}`}
                  >
                    Plătește cu crypto
                  </Link>
                  {plan.crypto ? <div className="mt-4 text-center text-sm text-slate-400">{plan.crypto}</div> : null}
                  <div className="mt-3 text-center text-sm text-slate-500">USDT / USDC pe Arbitrum</div>
                </article>
              ))}
            </div>
          </section>

          <section className="mb-10" id="bot">
            <div className="mb-6 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                AI Trading Bot
              </p>
              <h2 className="text-3xl font-bold text-white">Lasă botul să tradeuiasca pentru tine</h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                Strategii ML validate pe date reale, execuție automată pe Hyperliquid. Fără emoții, fără ezitare.
              </p>
              <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">20 Strategii ML</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">9 Assets</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Executie 24/7</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Alerte Telegram</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Dashboard Live</span>
              </div>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              {/* Bot standalone */}
              <article className="panel card-hover p-8">
                <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Bot Separat
                </div>
                <h3 className="text-2xl font-bold text-white">Bot AI Trading</h3>
                <div className="mb-6 mt-3">
                  <span className="text-5xl font-bold text-accent-emerald">$49</span>
                  <span className="text-slate-400">/luna</span>
                </div>
                <ul className="space-y-3">
                  {botFeatures.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-slate-300">
                      <span className="text-crypto-green">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <BotSmartCta />
                <Link
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-700 py-3 font-bold text-white hover:bg-slate-600"
                  href="/upgrade/pay?plan=bot_monthly"
                >
                  Plateste cu crypto
                </Link>
                <div className="mt-3 text-center text-sm text-slate-500">USDT / USDC pe Arbitrum</div>
              </article>

              {/* BEST VALUE: Elite + Bot Bundle */}
              <article className="relative rounded-[1.5rem] border-2 border-accent-emerald bg-surface-graphite p-8 shadow-glow card-hover md:scale-105">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-emerald px-4 py-1 text-sm font-bold text-crypto-dark">
                  BEST VALUE
                </div>
                <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent-emerald">
                  Elite + Bot Bundle
                </div>
                <h3 className="text-2xl font-bold text-white">Tot ce ai nevoie</h3>
                <div className="mb-4 mt-3">
                  <span className="text-2xl font-bold text-slate-500 line-through">$98</span>
                  <span className="ml-3 text-5xl font-bold text-accent-emerald">$59</span>
                  <span className="text-slate-400">/luna</span>
                  <div className="mt-2 text-sm font-semibold text-crypto-green">Economisesti $468/an</div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-slate-300">
                    <span className="text-accent-emerald">★</span>
                    <span className="font-semibold text-accent-emerald">Acces Elite complet</span>
                  </li>
                  {botFeatures.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-slate-300">
                      <span className="text-crypto-green">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-accent-emerald py-3 text-lg font-bold text-crypto-dark hover:bg-accent-soft"
                  href="/upgrade/pay?plan=elite_bot_bundle"
                >
                  Activeaza Bundle-ul
                </Link>
                <div className="mt-3 text-center text-sm text-slate-500">USDT / USDC pe Arbitrum</div>
              </article>

              {/* Bot for Elite members */}
              <article className="panel card-hover p-8">
                <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent-emerald">
                  Pret Membru Elite
                </div>
                <h3 className="text-2xl font-bold text-white">Bot AI Trading</h3>
                <div className="mb-6 mt-3">
                  <span className="text-2xl font-bold text-slate-500 line-through">$49</span>
                  <span className="ml-3 text-5xl font-bold text-accent-emerald">$29</span>
                  <span className="text-slate-400">/luna</span>
                  <div className="mt-2 text-sm font-semibold text-crypto-green">Economisesti $240/an</div>
                </div>
                <ul className="space-y-3">
                  {botFeatures.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-slate-300">
                      <span className="text-crypto-green">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-slate-700 py-3 font-bold text-white hover:bg-slate-600"
                  href="/upgrade/pay?plan=bot_monthly_elite"
                >
                  Plateste cu crypto
                </Link>
                <div className="mt-3 text-center text-sm text-slate-500">Deja membru Elite? Alege acest plan.</div>
              </article>
            </div>

            {/* BONUS section for Elite members */}
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-6 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent-emerald">
                Bonus pentru membrii Elite
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-300">
                <span className="rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-2">BTC Risk Dashboard</span>
                <span className="rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-2">Market Score in timp real</span>
                <span className="rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-2">Alerte de regim (Bull/Bear/Chop)</span>
              </div>
            </div>
          </section>

          <section className="panel px-6 py-8 text-center md:px-8">
            <h2 className="text-3xl font-bold text-white">Ai întrebări despre plată?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Plata se face în USDT sau USDC pe rețeaua Arbitrum One. După confirmare, accesul se activează automat.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
              <Link className="ghost-button" href="/dashboard">
                Înapoi în dashboard
              </Link>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}

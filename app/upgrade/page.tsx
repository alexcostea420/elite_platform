import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { pricingPlans } from "@/lib/constants/site";
import { buildPageMetadata, getUpgradeOfferSchema } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BotSmartCta } from "@/components/upgrade/bot-smart-cta";
import { PlanUpsellTrigger } from "@/components/upgrade/plan-upsell";

const comparisonRows: { label: string; free: boolean; elite: boolean }[] = [
  { label: "Chat general Discord", free: true, elite: true },
  { label: "Video-uri educaționale gratuite", free: true, elite: true },
  { label: "Biblioteca video completă (55+)", free: false, elite: true },
  { label: "Portofoliu Elite live", free: false, elite: true },
  { label: "Chat direct cu Alex", free: false, elite: true },
  { label: "Canale Elite (analize, trade ideas)", free: false, elite: true },
  { label: "Sesiuni live săptămânale", free: false, elite: true },
  { label: "Analize premium zilnice", free: false, elite: true },
  { label: "4 Indicatori TradingView exclusivi", free: false, elite: true },
  { label: "Resurse complete (ghiduri, watchlist)", free: false, elite: true },
  { label: "Risk Score BTC live", free: false, elite: true },
  { label: "Should I Trade? — decizia zilei", free: false, elite: true },
  { label: "Bot AI Trading (discount $45 vs $98)", free: false, elite: true },
  { label: "Suport prioritar", free: false, elite: true },
];

const planSlugMap: Record<string, string> = {
  "Încearcă Gratis!": "trial_3days",
  "30 Zile": "elite_monthly",
  "3 Luni": "elite_3mo",
  "12 Luni": "elite_annual",
};

const botFeatures = [
  "Bitcoin + Ethereum",
  "Altcoins: SOL, AVAX, DOGE, BNB, XRP + altele",
  "TradFi: SPX, Oil, Gold, Silver",
  "Supraveghere 24/7 de AI",
  "Auto-scaling în funcție de cont",
  "Auto-adaptare la condițiile pieței",
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

const veteranPrices: Record<string, string> = {
  "30 Zile": "$33",
  "3 Luni": "$100",
  "12 Luni": "$300",
};

export default async function UpgradePage() {
  const offerSchema = getUpgradeOfferSchema();

  // Check if user is logged in, veteran, and has used trial
  let isVeteran = false;
  let isLoggedIn = false;
  let hasUsedTrial = false;
  let userIdentity: { displayName: string; initials: string } | undefined;
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      isLoggedIn = true;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_veteran, full_name, subscription_status")
        .eq("id", user.id)
        .maybeSingle();
      isVeteran = profile?.is_veteran ?? false;
      hasUsedTrial = !!profile?.subscription_status; // any status means they've had an account
      const name = profile?.full_name ?? user.email ?? "Membru";
      userIdentity = {
        displayName: name,
        initials: name.slice(0, 2).toUpperCase(),
      };
    }
  } catch {
    // Not logged in — show normal prices
  }

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
        type="application/ld+json"
      />
      <Navbar mode={isLoggedIn ? "dashboard" : "marketing"} userIdentity={userIdentity} />
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
                    <div className="px-4 py-3 text-slate-200">{row.label}</div>
                    <div className="px-4 py-3 text-center">
                      {row.free ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400/60">✗</span>
                      )}
                    </div>
                    <div className="px-4 py-3 text-center">
                      {row.elite ? (
                        <span className="font-semibold text-accent-emerald">✓</span>
                      ) : (
                        <span className="text-red-400/60">✗</span>
                      )}
                    </div>
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

            {/* Trial Banner — only show for visitors who don't have an account yet */}
            {!hasUsedTrial && (
            <div className="mx-auto mb-8 max-w-2xl">
              <Link href="/signup" className="group relative block overflow-hidden rounded-[1.5rem] border-2 border-accent-emerald bg-gradient-to-r from-accent-emerald/10 via-surface-graphite to-accent-emerald/10 p-6 shadow-glow transition-all hover:shadow-[0_0_40px_rgba(105,224,143,0.3)] md:p-8">
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 rounded-b-xl bg-accent-emerald px-5 py-1.5 text-sm font-bold text-crypto-dark">
                  🎁 GRATIS
                </div>
                <div className="mt-4 flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white md:text-3xl">Încearcă Gratis!</h3>
                    <p className="mt-2 text-lg text-accent-emerald">3 zile acces complet — $0</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                      {["Portofoliu Elite live", "Chat cu Alex", "Canale Discord Elite", "Fără card"].map((perk) => (
                        <span key={perk} className="rounded-full border border-accent-emerald/30 bg-accent-emerald/5 px-3 py-1 text-xs text-accent-emerald">{perk}</span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-accent-emerald px-8 py-4 text-lg font-bold text-crypto-dark transition-colors group-hover:bg-accent-soft">
                      Începe Acum — Gratis →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
            )}

            {/* Paid Plans */}
            <div className="grid gap-8 md:grid-cols-3">
              {pricingPlans.filter((plan) => plan.name !== "Încearcă Gratis!").map((plan) => (
                <article key={plan.name} className={`relative rounded-[1.5rem] p-8 ${plan.highlighted ? "card-hover border-2 border-accent-emerald bg-surface-graphite shadow-glow" : "panel card-hover"}`}>
                  {plan.badge ? <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent-emerald px-4 py-1 text-sm font-bold text-crypto-dark">{plan.badge}</div> : null}
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <div className="mb-6 mt-3">
                    {isVeteran && veteranPrices[plan.name] ? (
                      <>
                        <span className="text-2xl font-bold text-slate-500 line-through">{plan.price}</span>
                        <span className="ml-3 text-5xl font-bold text-accent-emerald">{veteranPrices[plan.name]}</span>
                        <div className="mt-2 rounded-full inline-block bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 text-xs font-bold text-yellow-400">VETERAN PRICE</div>
                      </>
                    ) : (
                      <span className="text-5xl font-bold text-accent-emerald">{plan.price}</span>
                    )}
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
                  <PlanUpsellTrigger
                    planSlug={planSlugMap[plan.name] ?? "elite_monthly"}
                    planLabel={plan.name}
                    planPrice={isVeteran && veteranPrices[plan.name] ? veteranPrices[plan.name] : plan.price}
                  >
                    <button
                      className={`mt-8 inline-flex w-full items-center justify-center rounded-xl py-3 font-bold ${plan.highlighted ? "bg-accent-emerald text-crypto-dark hover:bg-accent-soft" : "bg-slate-700 text-white hover:bg-slate-600"}`}
                      type="button"
                    >
                      {plan.cta}
                    </button>
                  </PlanUpsellTrigger>
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
              <h2 className="text-3xl font-bold text-white">Lasă botul să tranzacționeze pentru tine</h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                Botul tranzacționează automat pe contul tău, 24/7. Tu te relaxezi, el face banii.
              </p>
              <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Crypto + TradFi</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Auto-scaling</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">24/7 AI</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Auto-adaptare</span>
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
                  <span className="text-5xl font-bold text-accent-emerald">$98</span>
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
                  <span className="text-2xl font-bold text-slate-500 line-through">$147</span>
                  <span className="ml-3 text-5xl font-bold text-accent-emerald">$94</span>
                  <span className="text-slate-400">/luna</span>
                  <div className="mt-2 text-sm font-semibold text-crypto-green">Economisești $636/an</div>
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
                  <span className="text-2xl font-bold text-slate-500 line-through">$98</span>
                  <span className="ml-3 text-5xl font-bold text-accent-emerald">$45</span>
                  <span className="text-slate-400">/luna</span>
                  <div className="mt-2 text-sm font-semibold text-crypto-green">Economisești $636/an</div>
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

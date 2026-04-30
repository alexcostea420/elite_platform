import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { LeadMagnetForm } from "@/components/ui/lead-magnet-form";
import { StripePayButton } from "@/components/upgrade/stripe-pay-button";
import { pricingPlans } from "@/lib/constants/site";
import { isStripeEnabled } from "@/lib/payments/stripe";
import { buildPageMetadata, getUpgradeOfferSchema } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TrialActivateButton } from "@/components/upgrade/trial-activate-button";

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
  { label: "Should I Trade? - decizia zilei", free: false, elite: true },
  { label: "Bot AI Trading (discount $45 vs $98)", free: false, elite: true },
  { label: "Suport prioritar", free: false, elite: true },
];

const planSlugMap: Record<string, string> = {
  "Încearcă Gratis!": "trial_3days",
  "30 Zile": "elite_monthly",
  "3 Luni": "elite_3mo",
  "12 Luni": "elite_annual",
};

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
  "30 Zile": "€33",
  "3 Luni": "€100",
  "12 Luni": "€300",
};


const binancePayUrls: Record<string, string> = {
  "30 Zile": "https://s.binance.com/ZJYlR2d9",
  "3 Luni": "https://s.binance.com/6ArLRVaz",
  "12 Luni": "https://s.binance.com/h0SDNHLp",
};

const binanceVeteranPayUrls: Record<string, string> = {
  "30 Zile": "https://s.binance.com/85wDO6eU",
  "3 Luni": "https://s.binance.com/MLpqdcAB",
  "12 Luni": "https://s.binance.com/DCSyNtVA",
};

export default async function UpgradePage() {
  const offerSchema = getUpgradeOfferSchema();

  // Check if user is logged in, veteran, and has used trial
  let stripeEnabled = false;
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
        .select("is_veteran, full_name, trial_used_at, role")
        .eq("id", user.id)
        .maybeSingle();
      isVeteran = profile?.is_veteran ?? false;
      hasUsedTrial = !!profile?.trial_used_at;
      // Stripe is in test mode until PFA is open — gate to admins only
      stripeEnabled = isStripeEnabled() && profile?.role === "admin";
      const name = profile?.full_name ?? user.email ?? "Membru";
      userIdentity = {
        displayName: name,
        initials: name.slice(0, 2).toUpperCase(),
      };
    }
  } catch {
    // Not logged in - show normal prices
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
            <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-6xl">
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

          <section className="mb-10">
            <article className="panel p-4 sm:p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white">Free vs Elite</h2>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
                <div className="min-w-[360px]">
                  <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] bg-white/5 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <div className="px-3 py-3 sm:px-4 sm:py-4">Acces</div>
                    <div className="px-3 py-3 sm:px-4 sm:py-4 text-center">Free</div>
                    <div className="px-3 py-3 sm:px-4 sm:py-4 text-center text-accent-emerald">Elite</div>
                  </div>
                  {comparisonRows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[1.2fr_0.9fr_0.9fr] border-t border-white/10 text-xs sm:text-sm">
                      <div className="px-3 py-2.5 sm:px-4 sm:py-3 text-slate-200">{row.label}</div>
                      <div className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">
                        {row.free ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-red-400/60">✗</span>
                        )}
                      </div>
                      <div className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">
                        {row.elite ? (
                          <span className="font-semibold text-accent-emerald">✓</span>
                        ) : (
                          <span className="text-red-400/60">✗</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <section className="mb-10" id="planuri">
            <h2 className="mb-6 text-center text-3xl font-bold text-white">Alege durata de acces</h2>

            {/* Trial Banner - for non-logged-in: signup link, for logged-in without trial: activate button */}
            {!hasUsedTrial && (
            <div className="mx-auto mb-8 max-w-2xl">
              {isLoggedIn ? (
                <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-accent-emerald bg-gradient-to-r from-accent-emerald/10 via-surface-graphite to-accent-emerald/10 p-6 md:p-8">
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 rounded-b-xl bg-accent-emerald px-5 py-1.5 text-sm font-bold text-crypto-dark">
                    🎁 GRATIS
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white md:text-3xl">Activează Trial Gratuit</h3>
                      <p className="mt-2 text-lg text-accent-emerald">7 zile acces complet - €0</p>
                      <p className="mt-1 text-sm text-amber-400">O singură perioadă de probă per cont</p>
                      <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                        {["Portofoliu Elite live", "Chat cu Alex", "Canale Discord Elite", "Fără card"].map((perk) => (
                          <span key={perk} className="rounded-full border border-accent-emerald/30 bg-accent-emerald/5 px-3 py-1 text-xs text-accent-emerald">{perk}</span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <TrialActivateButton />
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/signup" className="group relative block overflow-hidden rounded-[1.5rem] border-2 border-accent-emerald bg-gradient-to-r from-accent-emerald/10 via-surface-graphite to-accent-emerald/10 p-6 shadow-glow transition-all hover:shadow-[0_0_40px_rgba(11,102,35,0.3)] md:p-8">
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 rounded-b-xl bg-accent-emerald px-5 py-1.5 text-sm font-bold text-crypto-dark">
                    🎁 GRATIS
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white md:text-3xl">Încearcă Gratis!</h3>
                      <p className="mt-2 text-lg text-accent-emerald">7 zile acces complet - €0</p>
                      <p className="mt-1 text-sm text-amber-400">O singură perioadă de probă per cont</p>
                      <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                        {["Portofoliu Elite live", "Chat cu Alex", "Canale Discord Elite", "Fără card"].map((perk) => (
                          <span key={perk} className="rounded-full border border-accent-emerald/30 bg-accent-emerald/5 px-3 py-1 text-xs text-accent-emerald">{perk}</span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-2 rounded-xl bg-accent-emerald px-8 py-4 text-lg font-bold text-crypto-dark transition-colors group-hover:bg-accent-soft">
                        Creează Cont Gratuit →
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
            )}

            {/* Paid Plans */}
            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              {pricingPlans.filter((plan) => plan.name !== "Încearcă Gratis!").map((plan) => (
                <article key={plan.name} className={`relative flex flex-col rounded-[1.5rem] p-6 sm:p-8 ${plan.highlighted ? "card-hover border-2 border-accent-emerald bg-surface-graphite shadow-glow-strong" : "panel card-hover"}`}>
                  {plan.badge ? <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-emerald px-4 py-1 text-xs font-bold uppercase tracking-wider text-crypto-dark shadow-md">{plan.badge}</div> : null}
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
                  <ul className="flex-1 space-y-3">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-slate-300">
                        <span className="text-crypto-green">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 space-y-3">
                    {stripeEnabled && (
                      <StripePayButton
                        plan={planSlugMap[plan.name] ?? "elite_monthly"}
                        highlighted={!!plan.highlighted}
                      />
                    )}
                    <Link
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold ${plan.highlighted && !stripeEnabled ? "bg-accent-emerald text-crypto-dark hover:bg-accent-soft" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
                      href={`/upgrade/pay?plan=${planSlugMap[plan.name] ?? "elite_monthly"}`}
                    >
                      Plătește cu crypto (USDT/USDC)
                    </Link>
                    <a
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 py-3 font-bold text-yellow-400 hover:bg-yellow-500/10"
                      href={isVeteran && binanceVeteranPayUrls[plan.name] ? binanceVeteranPayUrls[plan.name] : binancePayUrls[plan.name]}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Plătește cu Binance
                    </a>
                    {stripeEnabled && (
                      <p className="text-center text-xs text-slate-600">Plata cu cardul este procesată securizat prin Stripe</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Bot Copytrade Section - Coming Soon */}
          <section className="mb-10" id="copytrade">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-surface-graphite via-crypto-dark to-surface-graphite">
              <div className="p-6 sm:p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                    Bot Trading Automat
                  </p>
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Coming Soon
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Copytrade V5 <span className="gradient-text">Bot</span>
                </h2>
                <div className="mt-3 max-w-2xl space-y-2 text-slate-400">
                  <p>Botul nostru tranzacționează automat pe 10+ active crypto cu strategii testate pe date reale.</p>
                  <p>Tu conectezi contul MEXC, botul face restul.</p>
                </div>

                {/* Two column pricing */}
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {/* Bundle - Most Popular */}
                  <div className="relative rounded-2xl border-2 border-accent-emerald bg-accent-emerald/[0.03] p-6">
                    <div className="absolute -top-3 left-6 rounded-full bg-accent-emerald px-4 py-1 text-xs font-bold text-crypto-dark">
                      CEL MAI POPULAR
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-white">Elite + Copytrade</h3>
                    <div className="mt-3">
                      <span className="text-4xl font-bold text-accent-emerald">€94</span>
                      <span className="text-slate-400">/lună</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">€49 Elite + €45 Copytrade</p>
                    <ul className="mt-5 space-y-2.5 text-sm">
                      {[
                        "Acces complet comunitate Discord",
                        "67+ video-uri educaționale",
                        "Indicatori Elite TradingView",
                        "Copytrade V5 bot (10+ active)",
                        "Suport prioritar la setup",
                        "Sesiuni live săptămânale",
                      ].map((perk) => (
                        <li key={perk} className="flex items-start gap-2 text-slate-300">
                          <span className="text-accent-emerald">✓</span>
                          {perk}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="mt-6 w-full rounded-xl bg-white/5 py-3 font-bold text-slate-500 cursor-not-allowed"
                      disabled
                      type="button"
                    >
                      Disponibil în curând
                    </button>
                  </div>

                  {/* Standalone */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h3 className="text-lg font-bold text-white">Copytrade Only</h3>
                    <div className="mt-3">
                      <span className="text-4xl font-bold text-slate-300">€109</span>
                      <span className="text-slate-400">/lună</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Doar copytrade, fără acces comunitate</p>
                    <ul className="mt-5 space-y-2.5 text-sm">
                      {[
                        "Copytrade V5 bot (10+ active)",
                        "Dashboard performanță",
                      ].map((perk) => (
                        <li key={perk} className="flex items-start gap-2 text-slate-400">
                          <span className="text-slate-600">✓</span>
                          {perk}
                        </li>
                      ))}
                      {[
                        "Fără acces comunitate Discord",
                        "Fără suport prioritar la setup*",
                        "Fără indicatori TradingView",
                      ].map((perk) => (
                        <li key={perk} className="flex items-start gap-2 text-slate-600">
                          <span className="text-slate-700">✗</span>
                          {perk}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="mt-6 w-full rounded-xl bg-white/5 py-3 font-bold text-slate-500 cursor-not-allowed"
                      disabled
                      type="button"
                    >
                      Disponibil în curând
                    </button>
                  </div>
                </div>

                {/* Bottom note */}
                <div className="mt-6 rounded-xl border border-accent-emerald/20 bg-accent-emerald/5 px-5 py-3 text-center">
                  <p className="text-sm text-accent-emerald">
                    <span className="font-bold">Economisești €15/lună</span> alegând bundle-ul Elite + Copytrade față de Copytrade Only.
                  </p>
                </div>

                {/* Stats preview - real data from trades.db */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { value: "12", label: "Active tranzacționate" },
                    { value: "62", label: "Tranzacții executate" },
                    { value: "51.6%", label: "Win Rate" },
                    { value: "24/7", label: "Tranzacționare automată" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-white/[0.03] px-4 py-3 text-center">
                      <p className="font-data text-2xl font-bold text-white">{stat.value}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-center text-xs text-slate-600">
                  * Copytrade Only fără suport la setup: configurarea contului MEXC se face individual, fără asistență dedicată.
                </p>
              </div>
            </div>
          </section>

          <section className="panel px-6 py-8 md:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Vrei să plătești dar nu știi cum?</h2>
              <p className="mx-auto mt-4 max-w-lg text-slate-300">
                Lasă-mi emailul tău și te contactez personal să te ajut cu plata. Răspund în maxim <span className="font-semibold text-white">24h</span>.
              </p>
              <LeadMagnetForm source="payment_help" />
              <p className="mt-3 text-xs text-slate-600">
                Plata se face în USDT sau USDC pe rețeaua Arbitrum One.
              </p>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}

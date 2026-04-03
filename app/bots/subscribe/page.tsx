import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { connectWalletAction, createBotSubscriptionAction, updateBotSettingsAction } from "@/app/bots/actions";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Abonare Bot Trading | Copytrade Automat",
  description:
    "Abonează-te la botul de trading automat și copiază tranzacțiile AI pe contul tău Hyperliquid.",
  keywords: ["abonare bot trading", "copytrade", "hyperliquid bot"],
  path: "/bots/subscribe",
  host: "app",
  index: false,
});

const WALLET_ADDRESS = process.env.PAYMENT_WALLET_ADDRESS_ARB ?? process.env.PAYMENT_WALLET_ADDRESS ?? "0x1af62fac769628ef0a2373d73190cc7cf77020ec";

const hyperliquidSteps = [
  "Accesează link-ul de referral de mai sus",
  "Conectează-ți wallet-ul (MetaMask, Rabby, etc.)",
  "Depozitează USDC pe Hyperliquid și începe",
];

type BotSubscribePageProps = {
  searchParams?: {
    settings?: string;
  };
};

export default async function BotSubscribePage({ searchParams }: BotSubscribePageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bots/subscribe");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, bot_active")
    .eq("id", user.id)
    .maybeSingle();

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isElite = profile?.subscription_tier === "elite";

  // Allow active subscribers to access wallet settings via ?settings=wallet
  const isWalletSettings = searchParams?.settings === "wallet";
  if (profile?.bot_active && !isWalletSettings) redirect("/bots/dashboard");

  const botPrice = isElite ? 45 : 98;

  return (
    <>
      <Navbar mode="marketing" />
      <main className="pb-20 pt-28">
        <Container>
          {/* Header */}
          <section className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Bot Trading Automat
            </p>
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              Copiază tranzacțiile AI pe{" "}
              <span className="gradient-text">Hyperliquid</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Bun venit, {identity.firstName}. Urmează pașii de mai jos pentru a
              activa botul de trading automat pe contul tău.
            </p>
          </section>

          {/* Step 1: Choose Plan */}
          <section className="mb-10">
            <StepHeader number={1} title="Alege Planul" />

            {isElite ? (
              <div className="mx-auto max-w-md">
                <article className="relative rounded-[1.5rem] border-2 border-accent-emerald bg-surface-graphite p-8 shadow-glow">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-emerald px-4 py-1 text-sm font-bold text-crypto-dark">
                    Discount Elite Activ
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                    Prețul tău Elite
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    Bot AI Trading
                  </h3>
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-slate-500 line-through">
                      $98
                    </span>
                    <span className="ml-3 text-5xl font-bold text-accent-emerald">
                      $45
                    </span>
                    <span className="text-slate-400">/lună</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-crypto-green">
                    Economisești $53/lună ca membru Elite
                  </p>
                  <ul className="mt-6 space-y-2">
                    {[
                      "Bitcoin + Ethereum",
                      "Altcoins: SOL, AVAX, DOGE, BNB, XRP + altele",
                      "Execuție automată 24/7",
                      "Alerte Telegram instant",
                      "Dashboard cu statistici live",
                    ].map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2 text-slate-300"
                      >
                        <span className="text-crypto-green">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            ) : (
              <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
                {/* Standard price */}
                <article className="panel p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Standard
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    Bot AI Trading
                  </h3>
                  <div className="mt-3">
                    <span className="text-5xl font-bold text-accent-emerald">
                      $98
                    </span>
                    <span className="text-slate-400">/lună</span>
                  </div>
                  <ul className="mt-6 space-y-2">
                    {[
                      "TradFi: SPX, Oil, Gold, Silver",
                      "Supraveghere 24/7 de AI",
                      "Execuție automată 24/7",
                      "Alerte Telegram",
                      "Dashboard live",
                    ].map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2 text-slate-300"
                      >
                        <span className="text-crypto-green">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                {/* Elite price */}
                <article className="relative rounded-[1.5rem] border-2 border-accent-emerald bg-surface-graphite p-8 shadow-glow">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-emerald px-4 py-1 text-sm font-bold text-crypto-dark">
                    Preț Elite
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                    Cu abonament Elite
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    Bot AI Trading
                  </h3>
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-slate-500 line-through">
                      $98
                    </span>
                    <span className="ml-3 text-5xl font-bold text-accent-emerald">
                      $45
                    </span>
                    <span className="text-slate-400">/lună</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-crypto-green">
                    Economisești $53/lună
                  </p>
                  <ul className="mt-6 space-y-2">
                    {[
                      "TradFi: SPX, Oil, Gold, Silver",
                      "Supraveghere 24/7 de AI",
                      "Execuție automată 24/7",
                      "Alerte Telegram",
                      "Dashboard live",
                    ].map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2 text-slate-300"
                      >
                        <span className="text-crypto-green">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <div className="col-span-full text-center">
                  <Link
                    href="/upgrade"
                    className="text-sm font-semibold text-accent-emerald underline underline-offset-4 transition hover:text-accent-soft"
                  >
                    Devino Elite și economisești $53/lună
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Plata Crypto */}
          <section className="mb-10">
            <StepHeader number={2} title="Plată Crypto" />

            <div className="panel mx-auto max-w-2xl p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                USDC pe Arbitrum
              </p>
              <p className="mt-3 text-slate-300">
                Trimite suma exactă la adresa de mai jos:
              </p>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Sumă de plată
                  </p>
                  <p className="mt-1 text-3xl font-bold text-accent-emerald">
                    ${botPrice}.00
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    USDC / USDT pe Arbitrum One
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Adresa wallet
                  </p>
                  <p className="mt-1 break-all rounded-lg border border-white/10 bg-surface-graphite px-4 py-3 font-mono text-sm text-white">
                    {WALLET_ADDRESS}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                <p className="text-sm text-yellow-200">
                  <span className="font-semibold">Important:</span> Referința
                  exactă a plății va fi generată automat la activare. Suma
                  afișată este orientativă.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 text-slate-400">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent-emerald" />
                <span className="text-sm">
                  Așteptăm confirmarea plății...
                </span>
              </div>
            </div>
          </section>

          {/* Step 3: Create Hyperliquid Account */}
          <section className="mb-10">
            <StepHeader number={3} title="Creează Cont Hyperliquid" />

            <div className="panel mx-auto max-w-2xl p-8">
              <p className="text-slate-300">
                Creează cont pe Hyperliquid folosind link-ul nostru de referral:
              </p>

              <a
                href="https://app.hyperliquid.xyz/join/ALEXCOSTEA"
                target="_blank"
                rel="noopener noreferrer"
                className="accent-button mt-4 inline-flex items-center gap-2 px-6 py-3 font-bold"
              >
                Deschide Hyperliquid
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>

              <div className="mt-8 space-y-4">
                {hyperliquidSteps.map((step, i) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent-emerald/30 bg-accent-emerald/10 text-sm font-bold text-accent-emerald">
                      {i + 1}
                    </div>
                    <p className="pt-1 text-slate-300">{step}</p>
                  </div>
                ))}
              </div>

              <label className="mt-8 flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-white/20 bg-surface-graphite text-accent-emerald focus:ring-accent-emerald"
                />
                <span className="text-sm text-slate-300">
                  Am creat contul folosind link-ul de referral
                </span>
              </label>
            </div>
          </section>

          {/* Step 4: Connect Wallet */}
          <section className="mb-10">
            <StepHeader number={4} title="Conectează Wallet" />

            <form action={connectWalletAction} className="panel mx-auto max-w-2xl p-8">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="hl_address">
                    Adresa Wallet Hyperliquid
                  </label>
                  <input
                    id="hl_address"
                    name="hl_address"
                    type="text"
                    placeholder="0x..."
                    required
                    className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  />
                  <p className="mt-2 text-xs text-slate-500">Adresa principală a contului tău Hyperliquid (nu API wallet)</p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="hl_api_private_key">
                    API Wallet Private Key
                  </label>
                  <input
                    id="hl_api_private_key"
                    name="hl_api_private_key"
                    type="password"
                    placeholder="0x... (private key generat din HL → API)"
                    required
                    className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  />
                  <p className="mt-2 text-xs text-slate-500">Generează din Hyperliquid → API → Create API Wallet (permisiuni: trade only, fără withdraw)</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-accent-emerald/20 bg-accent-emerald/5 p-4">
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-accent-emerald">
                    Securitate:
                  </span>{" "}
                  Folosim API wallet-ul DOAR pentru a plasa tranzacții. NU avem acces la
                  fondurile tale. API wallet-ul nu poate face withdraw.
                </p>
              </div>

              <button
                type="submit"
                className="accent-button mt-6 px-6 py-3 font-bold"
              >
                Salvează Wallet
              </button>
            </form>
          </section>

          {/* Step 5: Configuration */}
          <section className="mb-10">
            <StepHeader number={5} title="Configurare" />

            <form action={updateBotSettingsAction} className="panel mx-auto max-w-2xl p-8">
              {/* Auto-sizing */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5">
                <div>
                  <p className="font-semibold text-white">Auto-sizing</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Mărimea pozițiilor se calculează automat pe baza capitalului
                    tău
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" name="auto_sizing" defaultChecked className="peer sr-only" />
                  <div className="peer h-7 w-12 rounded-full bg-white/20 after:absolute after:left-[2px] after:top-[2px] after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent-emerald peer-checked:after:translate-x-5" />
                </label>
              </div>

              {/* Max risk — 4 fixed options */}
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                  Risc Maxim per Tranzacție
                </p>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {[
                    { value: "0.5", label: "0.5%", sublabel: "Safest" },
                    { value: "1", label: "1%", sublabel: "Conservator" },
                    { value: "1.5", label: "1.5%", sublabel: "Moderat" },
                    { value: "2", label: "2%", sublabel: "Standard" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer flex-col items-center rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:border-accent-emerald/50 has-[:checked]:border-accent-emerald has-[:checked]:bg-accent-emerald/10"
                    >
                      <input
                        type="radio"
                        name="max_risk_pct"
                        value={opt.value}
                        defaultChecked={opt.value === "2"}
                        className="sr-only"
                      />
                      <span className="text-xl font-bold text-white">{opt.label}</span>
                      <span className="mt-1 text-xs text-slate-500">{opt.sublabel}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Auto-sizing e activ implicit — mărimea pozițiilor se ajustează automat.
                  Riscul maxim limitează cât se poate pierde per tranzacție.
                </p>
              </div>

              <button type="submit" className="accent-button mt-6 w-full py-3 font-bold">
                Salvează Configurare
              </button>
            </form>
          </section>

          {/* Step 6: Confirmation */}
          <section className="mb-10">
            <StepHeader number={6} title="Confirmare" />

            <div className="panel mx-auto max-w-2xl p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-accent-emerald/30 bg-accent-emerald/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-8 w-8 text-accent-emerald"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">
                Ești live!
              </h3>
              <p className="mt-3 text-slate-300">
                Tranzacțiile vor fi copiate automat pe contul tău Hyperliquid.
                Poți monitoriza totul din dashboard.
              </p>
              <Link
                href="/bots/dashboard"
                className="accent-button mt-6 inline-flex px-8 py-3 text-lg font-bold"
              >
                Mergi la Dashboard Bot
              </Link>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Step header helper                                                 */
/* ------------------------------------------------------------------ */

function StepHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent-emerald bg-accent-emerald/10 text-lg font-bold text-accent-emerald">
        {number}
      </div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
  );
}

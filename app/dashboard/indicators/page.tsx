import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TimeGateLock } from "@/components/dashboard/time-gate-lock";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDaysUntilUnlock, getEliteDays, hasPassedTimeGate } from "@/lib/utils/time-gate";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Indicatori Elite | TradingView Indicators",
  description:
    "Indicatori TradingView exclusivi pentru membrii Elite: Elite Bands, Elite Momentum, Elite Levels, Elite Fib Zones.",
  keywords: ["indicatori tradingview", "elite bands", "elite momentum", "trading indicators"],
  path: "/dashboard/indicators",
  host: "app",
  index: false,
});

type Indicator = {
  name: string;
  description: string;
  icon: string;
  url: string;
};

const indicators: Indicator[] = [
  {
    name: "Elite Bands",
    description:
      "Benzi de volatilitate custom bazate pe deviații standard adaptate la regimul de piață. Identifică zone de suport/rezistență dinamic.",
    icon: "📈",
    url: "https://www.tradingview.com/script/5khlHMXt-Elite-Bands/",
  },
  {
    name: "Elite Momentum",
    description:
      "Indicator de momentum multi-timeframe care combină RSI, MACD și volume pentru semnale clare de intrare și ieșire.",
    icon: "⚡",
    url: "https://www.tradingview.com/script/AdER6U74-Elite-Momentum/",
  },
  {
    name: "Elite Levels",
    description:
      "Niveluri cheie de preț calculate automat: suporturi, rezistențe și zone de lichiditate pe baza price action.",
    icon: "🎯",
    url: "https://www.tradingview.com/script/HAt7SrgD-Elite-Levels/",
  },
  {
    name: "Elite Fib Zones",
    description:
      "Zone Fibonacci automate cu extensii și retrageri adaptate la swing-urile recente. Include confluențe între timeframe-uri.",
    icon: "🔮",
    url: "https://www.tradingview.com/script/FCvrNntd-Elite-Fib-Zones/",
  },
];

export default async function IndicatorsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/indicators");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, elite_since")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_tier !== "elite") {
    redirect("/upgrade");
  }

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const unlocked = hasPassedTimeGate(profile?.elite_since ?? null);
  const daysRemaining = getDaysUntilUnlock(profile?.elite_since ?? null);
  const eliteDays = getEliteDays(profile?.elite_since ?? null) ?? 0;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Header */}
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/dashboard">
                Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Indicatori</p>
            </div>
            <h1 className="text-4xl font-bold text-white">
              Indicatori <span className="gradient-text">Elite</span>
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Indicatori TradingView exclusivi, disponibili doar pentru membrii Elite cu minim 31 zile de membership.
            </p>
          </section>

          {!unlocked ? (
            <TimeGateLock daysRemaining={daysRemaining} featureName="Indicatori Elite" />
          ) : (
            <>
              {/* Status badge */}
              <section className="mb-8 rounded-2xl border border-accent-emerald/30 bg-accent-emerald/5 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-accent-emerald">Acces deblocat</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Ești membru Elite de {eliteDays} zile. Ai acces complet la toți indicatorii.
                    </p>
                  </div>
                  <span className="rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-2 text-sm font-semibold text-accent-emerald">
                    Activ
                  </span>
                </div>
              </section>

              {/* Indicators Grid */}
              <section className="mb-8 grid gap-6 md:grid-cols-2">
                {indicators.map((indicator) => (
                  <article key={indicator.name} className="panel p-6 md:p-8">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 text-3xl">
                        {indicator.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">{indicator.name}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">{indicator.description}</p>
                    <div className="mt-5">
                      <a
                        className="accent-button text-sm"
                        href={indicator.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Deschide pe TradingView
                      </a>
                    </div>
                  </article>
                ))}
              </section>

              {/* Video Tutorial */}
              <section className="panel mb-8 p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="mb-1 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Video Tutorial</p>
                    <h2 className="text-xl font-bold text-white">Cum sa folosesti indicatorii Elite</h2>
                    <p className="mt-2 text-sm text-slate-400">Tutorial complet: instalare, configurare si interpretare semnale.</p>
                  </div>
                  <a
                    className="accent-button shrink-0 text-center text-sm"
                    href="https://youtu.be/Gpz_TpMLu2I"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Vezi tutorial-ul
                  </a>
                </div>
              </section>

              {/* Instructions */}
              <section className="panel mb-8 p-6 md:p-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                  Cum adaugi indicatorii
                </p>
                <h2 className="mb-5 text-2xl font-bold text-white">Instalare în TradingView</h2>
                <div className="space-y-4 text-sm text-slate-300">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-emerald/10 text-xs font-bold text-accent-emerald">
                      1
                    </span>
                    <p>Deschide TradingView și navighează la chart-ul dorit.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-emerald/10 text-xs font-bold text-accent-emerald">
                      2
                    </span>
                    <p>Click pe &quot;Indicators&quot; (sau folosește shortcut-ul &quot;/&quot;).</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-emerald/10 text-xs font-bold text-accent-emerald">
                      3
                    </span>
                    <p>Caută indicatorul dorit (ex: &quot;Elite Bands&quot;) în tab-ul &quot;Invite-only Scripts&quot;.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-emerald/10 text-xs font-bold text-accent-emerald">
                      4
                    </span>
                    <p>Click pentru a-l adăuga pe chart. Dacă nu apare, verifică să ai acces (link-urile de mai sus).</p>
                  </div>
                </div>
              </section>
            </>
          )}
        </Container>
      </main>
      <Footer compact />
    </>
  );
}

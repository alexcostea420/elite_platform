import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { pricingPlans } from "@/lib/constants/site";
import { buildPageMetadata, getUpgradeOfferSchema } from "@/lib/seo";

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
              <Link className="accent-button px-8 py-4 text-lg font-bold" href="/#preturi">
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

          <section className="mb-10">
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
                  <Link className={`mt-8 inline-flex w-full items-center justify-center rounded-xl py-3 font-bold ${plan.highlighted ? "bg-accent-emerald text-crypto-dark hover:bg-accent-soft" : "bg-slate-700 text-white hover:bg-slate-600"}`} href="/#preturi">
                    Continuă spre ofertă
                  </Link>
                  {plan.crypto ? <div className="mt-4 text-center text-sm text-slate-400">{plan.crypto}</div> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="panel px-6 py-8 text-center md:px-8">
            <h2 className="text-3xl font-bold text-white">Ești gata să treci la Elite?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Dacă vrei acces complet la conținutul premium și la fluxul real de lucru din comunitate, acesta este următorul pas firesc.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
              <Link className="accent-button" href="/#preturi">
                Upgrade acum
              </Link>
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

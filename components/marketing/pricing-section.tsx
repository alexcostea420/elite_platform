import Link from "next/link";

import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { pricingPlans } from "@/lib/constants/site";

export function PricingSection() {
  return (
    <section className="px-4 py-20" id="preturi">
      <Container>
        {/* Trial CTA - standalone at top */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[1.75rem] border border-accent-emerald/20 bg-surface-graphite/80 p-8 text-center backdrop-blur-sm md:p-10">
            <div className="mb-3 text-3xl">🪖</div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              7 zile gratuit
            </p>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Testeaza totul. Fara card. Fara obligatii.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-400">
              Acces complet la Discord Elite, video-uri, indicatori, analize si portofoliul live.
              Dupa 7 zile decizi daca merita.
            </p>
            <Link
              className="accent-button mt-6 inline-block rounded-xl px-8 py-4 text-base font-bold"
              href="/signup"
            >
              Creeaza Cont Gratuit →
            </Link>
            <div className="mx-auto mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span>Fara card de credit</span>
              <span>Se anuleaza automat</span>
              <span>Acces complet</span>
            </div>
          </div>
        </div>

        {/* Paid plans - 3 columns below */}
        <div className="mt-16" />
        <SectionHeading title={<>Alege <span className="gradient-text">Planul Tau</span></>} description="Alege durata de acces potrivita pentru nivelul tau." />
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:gap-8 md:grid-cols-3">
          {pricingPlans.filter((plan) => plan.price !== "$0").map((plan) => (
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
                  <li key={perk} className="flex items-start gap-2">
                    <span className={perk.includes("prioritar") ? "text-accent-emerald" : "text-crypto-green"}>{perk.includes("prioritar") ? "★" : "✓"}</span>
                    <span className={perk.includes("prioritar") ? "font-semibold text-accent-emerald" : "text-slate-300"}>{perk}</span>
                  </li>
                ))}
              </ul>
              <Link className={`mt-8 inline-flex w-full items-center justify-center rounded-xl py-3 font-bold ${plan.highlighted ? "bg-accent-emerald text-crypto-dark hover:bg-accent-soft" : "bg-slate-700 text-white hover:bg-slate-600"}`} href="/upgrade">
                {plan.cta}
              </Link>
              {plan.crypto ? <div className="mt-4 text-center text-sm text-slate-400">{plan.crypto}</div> : null}
            </article>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3">
            <span className="text-2xl">🛡️</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Satisfacție Garantată</p>
              <p className="text-xs text-slate-400">Încearcă 7 zile gratuit. Dacă nu ești mulțumit, nu plătești nimic.</p>
            </div>
          </div>
        </div>
        <div className="mt-8 space-y-4 text-center">
          <p className="text-slate-400">Plati securizate prin Crypto (USDT)</p>
          <div className="flex items-center justify-center gap-4 text-3xl">
            <span>💳</span>
            <span>🔐</span>
            <span>₿</span>
          </div>
        </div>
      </Container>
    </section>
  );
}

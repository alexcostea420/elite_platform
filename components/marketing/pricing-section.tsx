import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { pricingPlans } from "@/lib/constants/site";

export function PricingSection() {
  return (
    <section className="px-4 py-20" id="preturi">
      <Container>
        <SectionHeading title={<>Alege <span className="gradient-text">Planul Tău</span></>} description="Alege durata de acces potrivită pentru nivelul tău." />
        <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
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
                  <li key={perk} className="flex items-start gap-2">
                    <span className={perk.includes("prioritar") ? "text-accent-emerald" : "text-crypto-green"}>{perk.includes("prioritar") ? "★" : "✓"}</span>
                    <span className={perk.includes("prioritar") ? "font-semibold text-accent-emerald" : "text-slate-300"}>{perk}</span>
                  </li>
                ))}
              </ul>
              <button className={`mt-8 w-full rounded-xl py-3 font-bold ${plan.highlighted ? "bg-accent-emerald text-crypto-dark hover:bg-accent-soft" : "bg-slate-700 text-white hover:bg-slate-600"}`} type="button">
                {plan.cta}
              </button>
              {plan.crypto ? <div className="mt-4 text-center text-sm text-slate-400">{plan.crypto}</div> : null}
            </article>
          ))}
        </div>
        <div className="mt-12 space-y-4 text-center">
          <p className="text-slate-400">Plăți securizate prin Stripe sau Crypto (USDT)</p>
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

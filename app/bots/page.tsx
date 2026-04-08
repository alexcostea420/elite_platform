import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Bot Trading Automat | MEXC Copytrade",
  description:
    "Bot de trading automat care copiaza tranzactiile pe contul tau MEXC. Sizing automat, 24/7, zero acces la fonduri.",
  keywords: [
    "bot trading",
    "copytrade crypto",
    "trading automat",
    "MEXC bot",
    "bot AI trading",
  ],
  path: "/bots",
  host: "app",
  index: true,
});

const features = [
  {
    icon: "📐",
    title: "Sizing Automat",
    description:
      "Marimea pozitiei se ajusteaza automat in functie de balanta ta si volatilitatea pietei. Nu trebuie sa calculezi nimic.",
  },
  {
    icon: "⏰",
    title: "Activ 24/7",
    description:
      "Botul tranzactioneaza non-stop, indiferent daca dormi, lucrezi sau esti in vacanta. Nicio oportunitate pierduta.",
  },
  {
    icon: "🔒",
    title: "Zero Acces la Fonduri",
    description:
      "API-ul MEXC pe care il conectezi nu permite retrageri. Fondurile raman in totalitate sub controlul tau.",
  },
  {
    icon: "🏦",
    title: "MEXC Exchange",
    description:
      "Conectare directa la MEXC, unul dintre cele mai mari exchange-uri de crypto. Setup simplu in cateva minute.",
  },
];

const faqItems = [
  {
    q: "Cum functioneaza copytrade-ul?",
    a: "Conectezi contul MEXC prin API (read-only + trade). Botul nostru copiaza automat tranzactiile pe contul tau, cu sizing ajustat la balanta ta.",
  },
  {
    q: "Este sigur? Poate botul sa retraga fonduri?",
    a: "Nu. API-ul MEXC pe care il configurezi nu permite retrageri. Fondurile tale raman 100% sub controlul tau.",
  },
  {
    q: "Care e balanta minima recomandata?",
    a: "$100 este minimul recomandat pentru a beneficia de diversificarea completa.",
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

export default function BotsPage() {
  // Coming Soon - full page ready but not activated yet
  return (
    <>
      <Navbar mode="marketing" />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <section className="panel mx-auto max-w-2xl p-8 text-center md:p-12">
            <div className="mb-4 text-5xl">🤖</div>
            <h1 className="text-3xl font-bold text-white">Bot Trading Automat</h1>
            <h2 className="mt-2 text-xl font-semibold text-accent-emerald">Coming Soon</h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">
              Un bot care tranzactioneaza pentru tine, non-stop. Tu setezi riscul, el executa.
            </p>
            <p className="mt-4 text-sm font-semibold text-accent-emerald">
              Membrii Elite vor primi acces prioritar si pret redus.
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

  /* ── Full bot landing page (activate when ready) ── */
  /* eslint-disable no-unreachable */
  return (
    <>
      <Navbar mode="marketing" />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <section className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-1.5 text-sm font-semibold text-accent-emerald">
              <span>🏦</span> MEXC Exchange
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white md:text-6xl">
              Bot Trading Automat
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300 md:text-xl">
              Copiaza tranzactiile automat pe contul tau MEXC. Tu setezi riscul, botul executa. Non-stop, fara interventie manuala.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link className="accent-button px-8 py-3.5 text-lg font-bold" href="/bots/subscribe">
                Incepe acum
              </Link>
              <a className="ghost-button px-8 py-3.5" href="#preturi">
                Vezi preturile
              </a>
            </div>
          </section>
        </Container>

        {/* Features */}
        <Container className="mt-20">
          <SectionHeading
            eyebrow="De ce sa folosesti botul"
            title="Trading automat, risc controlat"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <article key={f.title} className="panel p-6">
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{f.description}</p>
              </article>
            ))}
          </div>
        </Container>

        {/* Pricing */}
        <Container className="mt-20">
          <div id="preturi" />
          <SectionHeading
            eyebrow="Preturi simple"
            title="Alege planul potrivit"
          />
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
            {/* Standalone */}
            <article className="panel border border-white/10 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Standard</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$98</span>
                <span className="text-slate-400">/luna</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Pentru traderi care vor sa automatizeze fara abonament Elite.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Copytrade automat 24/7",
                  "Sizing automat dupa balanta",
                  "Dashboard cu statistici",
                  "Suport dedicat",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-accent-emerald">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link className="ghost-button mt-8 block w-full py-3 text-center font-bold" href="/bots/subscribe">
                Incepe acum
              </Link>
            </article>

            {/* Elite */}
            <article className="panel relative border-2 border-accent-emerald/50 p-8">
              <div className="absolute -top-3 right-6 rounded-full bg-accent-emerald px-3 py-1 text-xs font-bold text-crypto-dark">
                Recomandat
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">Pentru membri Elite</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$45</span>
                <span className="text-slate-400">/luna</span>
              </div>
              <p className="mt-1 text-sm text-green-400">Economisesti $53/luna fata de Standard</p>
              <p className="mt-2 text-sm text-slate-400">
                Pret redus exclusiv pentru membrii cu abonament Elite activ.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Tot ce include Standard",
                  "Pret redus cu 54%",
                  "Acces comunitate Elite",
                  "Semnale premium + analize",
                  "Suport prioritar",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-accent-emerald">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link className="accent-button mt-8 block w-full py-3 text-center font-bold" href="/bots/subscribe">
                Incepe acum
              </Link>
            </article>
          </div>
        </Container>

        {/* FAQ */}
        <Container className="mt-20">
          <SectionHeading
            eyebrow="Intrebari frecvente"
            title="Tot ce trebuie sa stii"
          />
          <div className="mx-auto mt-12 max-w-3xl space-y-4">
            {faqItems.map((item) => (
              <article key={item.q} className="panel p-6">
                <h3 className="font-bold text-white">{item.q}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.a}</p>
              </article>
            ))}
          </div>
        </Container>

        {/* Disclaimer */}
        <Container className="mt-16">
          <div className="mx-auto max-w-3xl rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-6 py-5 text-center">
            <p className="text-xs text-yellow-200/70">
              <span className="font-semibold">Disclaimer:</span> Trading-ul de criptomonede implica riscuri semnificative. Performanta trecuta nu garanteaza rezultate viitoare. Nu investi mai mult decat iti permiti sa pierzi. Botul este un instrument de automatizare, nu o garantie de profit.
            </p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

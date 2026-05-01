import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { BookingForm } from "@/components/sesiuni/booking-form";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata({
  title: "Sesiuni 1-la-1 cu Alex | Mentoring Trading & Crypto",
  description:
    "Ședințe individuale de mentoring cu Alex Costea. Învață să-ți configurezi singur TradingView, să-ți selectezi monedele și să-ți urmărești portofoliul. €75/oră sau pachet 3 ore €197.",
  keywords: [
    "sesiuni 1 la 1 trading",
    "mentoring crypto romania",
    "consultanță trading individuală",
    "alex costea coaching",
    "tradingview setup ajutor",
    "învață crypto unu la unu",
  ],
  path: "/sesiuni",
  host: "app",
});

const subjects = [
  {
    icon: "📊",
    title: "TradingView de la zero",
    desc: "Cont, layout, indicatori, alerte, watchlist-uri. Pleci cu instrumentul setat exact pe stilul tău.",
  },
  {
    icon: "🪙",
    title: "Cum îți alegi monedele",
    desc: "Criterii de selecție, screening, sectoare, narrative. Nu îți spun ce să cumperi, îți arăt cum gândesc eu, ca să decizi singur.",
  },
  {
    icon: "📈",
    title: "Cum îți urmărești portofoliul",
    desc: "Tracking, rebalansare, alerte de preț, weekly review. Sistem repetabil, nu intuiție.",
  },
  {
    icon: "🛡️",
    title: "Risk management de bază",
    desc: "Position sizing, stop loss, când ieși. Regula 1-2% explicată concret pe portofoliul tău.",
  },
  {
    icon: "📰",
    title: "Cum filtrezi zgomotul",
    desc: "Surse de încredere, ce ignori, cum nu cazi în pump-uri Telegram. Mental framework anti-FOMO.",
  },
  {
    icon: "🎯",
    title: "Macro & ciclu Bitcoin",
    desc: "Cum citesc ciclul, ce înseamnă fazele, ce metrice contează. Pentru cei care vor context, nu trade-uri.",
  },
];

const packages = [
  {
    name: "1 oră",
    price: "€75",
    period: "/ședință",
    desc: "Una și gata. Pentru întrebări punctuale sau setup TradingView.",
    perks: [
      "60 minute Zoom/Google Meet",
      "Înregistrare ședință (păstrezi)",
      "1 follow-up scurt pe email",
      "Materiale sau link-uri menționate",
    ],
    cta: "Rezervă 1 oră",
    highlighted: false,
    pkgKey: "single",
  },
  {
    name: "Pachet 3 ore",
    price: "€197",
    period: "/3 ședințe",
    desc: "Recomandat. Suficient cât să înveți tot setup-ul + să prinzi obișnuința.",
    perks: [
      "3 × 60 minute, programate cum vrei tu",
      "Înregistrări la fiecare ședință",
      "Plan personalizat între ședințe",
      "Follow-up nelimitat pe email",
      "Economisești €28 (12% vs ședințe separate)",
    ],
    cta: "Rezervă pachetul",
    highlighted: true,
    badge: "POPULAR",
    pkgKey: "triple",
  },
];

const faqs = [
  {
    q: "Pentru cine sunt aceste sesiuni?",
    a: "Pentru oricine vrea să învețe să-și configureze singur instrumentele de trading și să-și gestioneze portofoliul. Începători (cei mai mulți): pleci cu un setup complet. Intermediari: clarificări pe risk management și screening. Pentru traderi activi care vor coaching pe execuție, ar fi nevoie de mai multe ședințe (3+).",
  },
  {
    q: "E același lucru cu abonamentul Elite?",
    a: "Nu. Elite (€49/lună) e accesul la comunitate, video-uri, indicatori, dashboard-uri și analize live. Sesiunile 1-la-1 sunt timpul meu personal cu tine, custom pe situația ta. Multe persoane folosesc ambele: Elite pentru flow-ul zilnic, sesiuni 1-la-1 pentru clarificări mari.",
  },
  {
    q: "Promiteți profit garantat?",
    a: "Nu. Niciodată. Te învăț cum să gândești, cum să-ți configurezi instrumentele, cum să eviți greșelile clasice. Profit nu garantează nimeni. Dacă cineva îți promite, fugi.",
  },
  {
    q: "Cum se desfășoară o ședință?",
    a: "Online, pe Zoom sau Google Meet, cu screen-share. Tu împărtășești ecranul, eu îți arăt configurări sau invers. La final primești înregistrarea ca să revii peste lecție când ai nevoie.",
  },
  {
    q: "Ce pregătesc înainte?",
    a: "După ce trimiți cererea, primești un email cu 3-5 întrebări scurte (cât experiență ai, ce vrei să rezolvi, ce platforme folosești). În baza răspunsurilor, vin pregătit cu un plan concret, nu pierdem timp pe introduceri.",
  },
  {
    q: "Pot plăti cu crypto?",
    a: "Da. USDT/USDC pe Arbitrum sau Binance Pay. După ce confirm cererea, îți trimit instrucțiuni de plată. Card Stripe disponibil curând (după PFA).",
  },
  {
    q: "Ce se întâmplă dacă pachetul de 3 nu se potrivește?",
    a: "Dacă după prima ședință simți că nu e pentru tine, primești înapoi €122 (cele 2 ședințe rămase). Fără întrebări.",
  },
  {
    q: "Cât timp are valabilitate pachetul?",
    a: "6 luni de la prima ședință. Cele 3 ore le programezi cum îți convine: săptămâna asta toate, sau câte una pe lună.",
  },
];

export default async function SesiuniPage() {
  let isLoggedIn = false;
  let userIdentity: { displayName: string; initials: string } | undefined;
  let userEmail = "";
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      isLoggedIn = true;
      userEmail = user.email ?? "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const name = profile?.full_name ?? user.email ?? "Membru";
      userIdentity = {
        displayName: name,
        initials: name.slice(0, 2).toUpperCase(),
      };
    }
  } catch {
    // Not logged in
  }

  return (
    <>
      <Navbar mode={isLoggedIn ? "dashboard" : "marketing"} userIdentity={userIdentity} />
      <main className="pb-20 pt-28">
        <Container>
          {/* Hero */}
          <section className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Mentoring 1-la-1
            </p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-6xl">
              Învață să tranzacționezi <span className="gradient-text">singur</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-slate-300">
              Ședințe individuale cu Alex Costea. Pleci cu TradingView configurat, monedele alese, portofoliul urmărit, toate făcute de tine, nu copiate de la altcineva.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
              Nu vând semnale. Te învăț cadrul ca să nu mai ai nevoie de mine.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link className="accent-button px-8 py-4 text-lg font-bold" href="#rezervare">
                Rezervă o ședință
              </Link>
              <Link className="ghost-button px-8 py-4 text-lg font-bold" href="#temele">
                Vezi ce poți învăța
              </Link>
            </div>
          </section>

          {/* What you can learn */}
          <section className="mb-16" id="temele">
            <h2 className="mb-2 text-center text-3xl font-bold text-white">Ce poți învăța într-o ședință</h2>
            <p className="mx-auto mb-10 max-w-2xl text-center text-slate-400">
              Tu alegi tema. Eu vin pregătit cu setup-ul concret pe situația ta.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => (
                <article
                  key={s.title}
                  className="panel card-hover p-6"
                >
                  <div className="mb-3 text-3xl">{s.icon}</div>
                  <h3 className="mb-2 text-lg font-bold text-white">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{s.desc}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
              <p className="text-sm text-amber-200">
                <span className="font-bold">Pentru traderi activi:</span> dacă vrei coaching pe execuție (entries, exits, risk pe trade-uri reale), e nevoie de minim 3 ședințe ca să prind contextul tău și să fie util cu adevărat. Pachetul de 3 e ideal aici.
              </p>
            </div>
          </section>

          {/* Pricing */}
          <section className="mb-16" id="preturi">
            <h2 className="mb-10 text-center text-3xl font-bold text-white">Alege formatul</h2>
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
              {packages.map((pkg) => (
                <article
                  key={pkg.name}
                  className={`relative flex flex-col rounded-[1.5rem] p-6 sm:p-8 ${
                    pkg.highlighted
                      ? "card-hover border-2 border-accent-emerald bg-surface-graphite shadow-glow-strong"
                      : "panel card-hover"
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent-emerald px-4 py-1 text-sm font-bold text-crypto-dark">
                      {pkg.badge}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white">{pkg.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{pkg.desc}</p>
                  <div className="my-6">
                    <span className="text-5xl font-bold text-accent-emerald">{pkg.price}</span>
                    <span className="ml-2 text-slate-400">{pkg.period}</span>
                  </div>
                  <ul className="space-y-3">
                    {pkg.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="mt-0.5 text-accent-emerald">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#rezervare"
                    className={`mt-8 block rounded-xl px-6 py-3 text-center font-bold transition ${
                      pkg.highlighted
                        ? "bg-accent-emerald text-crypto-dark hover:bg-accent-soft"
                        : "border border-accent-emerald/40 text-accent-emerald hover:bg-accent-emerald/10"
                    }`}
                  >
                    {pkg.cta}
                  </a>
                </article>
              ))}
            </div>
          </section>

          {/* Booking form */}
          <section className="mb-16" id="rezervare">
            <div className="mx-auto max-w-2xl">
              <div className="panel p-6 sm:p-8 md:p-10">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">Rezervă o ședință</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Completează formularul. Te contactez în maxim 24h cu opțiuni de oră și instrucțiuni de plată.
                </p>
                <BookingForm defaultEmail={userEmail} />
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <h2 className="mb-10 text-center text-3xl font-bold text-white">Întrebări frecvente</h2>
            <div className="mx-auto max-w-3xl space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group panel cursor-pointer p-6 transition hover:border-accent-emerald/30"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-white">
                    {faq.q}
                    <span className="ml-4 text-accent-emerald transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Closing CTA */}
          <section className="text-center">
            <div className="mx-auto max-w-2xl rounded-3xl border border-accent-emerald/20 bg-accent-emerald/5 p-8 sm:p-12">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Nu ești sigur dacă e pentru tine?</h2>
              <p className="mt-3 text-slate-300">
                Scrie-mi pe Discord sau pe Telegram cu situația ta concretă. Îți spun direct dacă o ședință te-ar ajuta sau dacă ai nevoie de altceva (Elite, mai întâi free content, etc.).
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="https://discord.gg/ecNNcV5GD9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ghost-button px-6 py-3 text-sm font-bold"
                >
                  Discord
                </Link>
                <Link href="/upgrade" className="ghost-button px-6 py-3 text-sm font-bold">
                  Sau vezi Elite (€49/lună)
                </Link>
              </div>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}

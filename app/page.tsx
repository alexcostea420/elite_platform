import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AlexsBrainSection } from "@/components/marketing/alexs-brain-section";
import { HeroIntro } from "@/components/marketing/hero-intro";
import { HeroSection } from "@/components/marketing/hero-section";
import { TrackRecordTeaser } from "@/components/marketing/track-record-teaser";
import { Container } from "@/components/ui/container";
import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const AboutSection = dynamic(() => import("@/components/marketing/about-section").then(m => m.AboutSection));
const FaqSection = dynamic(() => import("@/components/marketing/faq-section").then(m => m.FaqSection));
const PricingSection = dynamic(() => import("@/components/marketing/pricing-section").then(m => m.PricingSection));
const TestimonialsSection = dynamic(() => import("@/components/marketing/testimonials-section").then(m => m.TestimonialsSection));
const TrialPopup = dynamic(() => import("@/components/marketing/trial-popup").then(m => m.TrialPopup));
import {
  buildPageMetadata,
  getHomepageFaqSchema,
  getHomepageOrganizationSchema,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Comunitate Trading Crypto România | Armata de Traderi",
  description:
    "Comunitate trading crypto România cu semnale crypto, educație și sesiuni live. Intră în Armata de Traderi și începe cu accesul potrivit pentru tine.",
  keywords: [
    "comunitate trading crypto romania",
    "semnale crypto",
    "grup traderi",
    "curs trading",
    "educatie crypto romania",
    "trading crypto romania",
    "discord trading crypto",
  ],
  path: "/",
});

export default async function HomePage() {
  const organizationSchema = getHomepageOrganizationSchema();
  const faqSchema = getHomepageFaqSchema();

  // Fetch live risk score data for landing strip
  const supabase = createServiceRoleSupabaseClient();
  const { data: riskRow } = await supabase
    .from("trading_data")
    .select("data")
    .or("key.eq.risk_score_v2,key.eq.risk_score")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const rs = riskRow?.data as { score?: number; decision?: string; btc_price_live?: number; btc_price?: number; fear_greed?: { value?: number }; pct_from_ath?: number } | null;
  const riskScore = rs?.score ?? 67;
  const riskDecision = rs?.decision === "BUY" ? "CUMPARA" : rs?.decision === "SELL" ? "VINDE" : "ASTEAPTA";
  const btcPrice = rs?.btc_price_live ?? rs?.btc_price ?? 0;
  const fearGreed = rs?.fear_greed?.value ?? 0;
  const pctAth = rs?.pct_from_ath ?? 0;

  const features: { label: string; title: string; desc: string[] }[] = [
    {
      label: "ANALIZĂ SĂPTĂMÂNALĂ",
      title: "Știi exact când să cumperi",
      desc: [
        "Un scor de la 0 la 100 care îți arată unde stă piața.",
        "Bazat pe Fear & Greed, distanța de ATH, sentiment și cicluri.",
        "Actualizat săptămânal.",
      ],
    },
    {
      label: "16 ACȚIUNI MONITORIZATE",
      title: "Zone clare de Buy și Sell",
      desc: [
        "Fiecare acțiune cu 2 zone de cumpărare și 2 zone de vânzare.",
        "Știi exact unde intri și unde ieși.",
      ],
    },
    {
      label: "TIMING RESEARCH",
      title: "9 metode. Un singur calendar.",
      desc: [
        "Eclipse, Fibonacci, Gann, Halving, Blood Moon.",
        "Toate analizate și combinate într-un scor de convergență.",
      ],
    },
    {
      label: "55+ VIDEO-URI",
      title: "De la zero la execuție",
      desc: [
        "Fiecare video te duce cu un pas mai aproape de consistență.",
        "Analiză tehnică, risk management, psihologie.",
      ],
    },
    {
      label: "350+ TRADERI",
      title: "Nu mai tranzacționezi singur",
      desc: [
        "Întreabă orice, primești răspuns.",
        "Discuții zilnice, analize și sesiuni live săptămânale cu Alex.",
      ],
    },
  ];

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        type="application/ld+json"
      />
      <HeroIntro />
      <Navbar mode="marketing" />
      <main>
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. About */}
        <AboutSection />

        {/* 4. Track Record Teaser */}
        <section className="py-12 md:py-20" style={{ background: "linear-gradient(180deg, transparent, rgba(239,68,68,0.02) 50%, transparent)" }}>
          <Container>
            <div className="mx-auto max-w-4xl text-center">
              <p className="section-label mb-3">TRACK RECORD PUBLIC</p>
              <h2 className="text-2xl font-bold text-white md:text-4xl">
                Am ieșit din piață înainte de crash-ul din Octombrie 2025.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 md:text-base">
                Fiecare decizie documentată pe Discord, cu timestamp imuabil. De la 55% cash in August la 100% USDC pe 30 Octombrie - înainte ca piața să piardă -60%.
              </p>
              <TrackRecordTeaser />
              <Link className="ghost-button mt-8 inline-block" href="/track-record">
                Vezi tot Track Record-ul →
              </Link>
            </div>
          </Container>
        </section>

        {/* 5. Feature Sections - Instrumentele Tale */}
        <section className="py-12 md:py-20" id="instrumente">
          <Container>
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Tot ce ai nevoie</p>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Instrumentele <span className="gradient-text">Tale</span>
              </h2>
            </div>

            <div className="space-y-24">
              {/* Feature 1: Risk Score - text left, preview right */}
              <div className="flex flex-col items-center gap-10 md:flex-row">
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">{features[0].label}</p>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{features[0].title}</h3>
                  <div className="space-y-2 text-slate-400">
                    {features[0].desc.map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="glass-card flex h-48 w-48 flex-col items-center justify-center rounded-full border border-accent-emerald/30">
                    <span className="text-5xl font-bold text-accent-emerald">{riskScore}</span>
                    <span className="mt-1 text-sm font-semibold uppercase tracking-wider text-accent-emerald/80">{riskDecision}</span>
                    <span className="mt-1 text-[10px] text-slate-500">scor live</span>
                  </div>
                </div>
              </div>

              {/* Feature 2: Stocks - preview left, text right */}
              <div className="flex flex-col-reverse items-center gap-10 md:flex-row">
                <div className="flex flex-1 items-center justify-center">
                  <div className="glass-card w-full max-w-sm space-y-2 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      <span>Mostră dashboard</span>
                      <span className="rounded border border-slate-700/50 bg-slate-800/40 px-1.5 py-0.5 text-[9px] text-slate-400">exemplu</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 text-xs text-slate-500">
                      <span>Acțiune</span><span>Zonă</span><span>Semnal</span>
                    </div>
                    {[
                      { ticker: "TSLA", zone: "S1", signal: "HOLD", color: "text-yellow-400", bg: "bg-yellow-500/10" },
                      { ticker: "MSFT", zone: "B2", signal: "BUY", color: "text-accent-emerald", bg: "bg-accent-emerald/10" },
                      { ticker: "GOOG", zone: "S2", signal: "SELL", color: "text-red-400", bg: "bg-red-500/10" },
                      { ticker: "NVDA", zone: "S1", signal: "HOLD", color: "text-yellow-400", bg: "bg-yellow-500/10" },
                      { ticker: "ORCL", zone: "B1", signal: "BUY", color: "text-accent-emerald", bg: "bg-accent-emerald/10" },
                    ].map((s) => (
                      <div key={s.ticker} className="flex items-center justify-between py-1">
                        <span className="font-mono text-sm font-bold text-white w-14">{s.ticker}</span>
                        <span className="font-mono text-xs text-slate-400">{s.zone}</span>
                        <span className={`rounded ${s.bg} px-2 py-0.5 text-xs font-semibold ${s.color}`}>{s.signal}</span>
                      </div>
                    ))}
                    <p className="pt-1 text-[10px] text-slate-600">Date live în /dashboard/stocks (16 acțiuni).</p>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">{features[1].label}</p>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{features[1].title}</h3>
                  <div className="space-y-2 text-slate-400">
                    {features[1].desc.map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                </div>
              </div>

              {/* Feature 3: Pivot Dashboard - text left, preview right */}
              <div className="flex flex-col items-center gap-10 md:flex-row">
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">{features[2].label}</p>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{features[2].title}</h3>
                  <div className="space-y-2 text-slate-400">
                    {features[2].desc.map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="glass-card w-full max-w-sm space-y-4 rounded-2xl p-6">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      <span>Calendar pivoți</span>
                      <span className="rounded border border-slate-700/50 bg-slate-800/40 px-1.5 py-0.5 text-[9px] text-slate-400">exemplu</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Convergență metode</span>
                      <span className="font-mono text-xs text-accent-emerald">3/9</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                      <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-accent-emerald to-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-500">Eclipse, Fibonacci, Gann, Halving, Blood Moon.</p>
                  </div>
                </div>
              </div>

              {/* Feature 4: Educatie - preview left, text right */}
              <div className="flex flex-col-reverse items-center gap-10 md:flex-row">
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex w-full max-w-sm gap-2">
                    {[
                      { tag: "ANALIZĂ", icon: "📊", title: "BTC ETH bullish, blackswan cu razboiul?", date: "8 apr. 2026" },
                      { tag: "UPDATE", icon: "🔄", title: "Platforma noua + Trade pe BITCOIN", date: "8 apr. 2026" },
                      { tag: "EDUCAȚIE", icon: "📚", title: "Cum să folosești indicatorii Elite", date: "1 apr. 2026" },
                    ].map((v) => (
                      <div key={v.title} className="glass-card flex-1 overflow-hidden rounded-xl">
                        <div className="relative flex h-20 items-center justify-center bg-gradient-to-br from-accent-emerald/10 to-surface-graphite">
                          <span className="text-2xl">{v.icon}</span>
                          <span className="absolute left-2 top-2 rounded bg-accent-emerald/20 border border-accent-emerald/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent-emerald">{v.tag}</span>
                        </div>
                        <div className="p-2">
                          <p className="text-[10px] text-accent-emerald">{v.date}</p>
                          <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-300 line-clamp-2">{v.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">{features[3].label}</p>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{features[3].title}</h3>
                  <div className="space-y-2 text-slate-400">
                    {features[3].desc.map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                </div>
              </div>

              {/* Feature 5: Comunitate - text left, screenshot right */}
              <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">{features[4].label}</p>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{features[4].title}</h3>
                  <ul className="space-y-3 text-sm text-slate-400">
                    {[
                      "Bias zilnic pe Bitcoin, Ethereum, Stocks și USDT.D - analizele mele pe cele mai importante asset-uri",
                      "Trade ideas live de la mine și membri cu entry, SL și TP",
                      "Jurnal personal de trading - ține evidența evoluției tale ca trader",
                      "Materiale educative și resurse curate pentru orice nivel",
                      "Trading room live + chat privat cu comunitatea",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 text-accent-emerald">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mx-auto w-[240px] shrink-0 md:w-[280px]">
                  <div className="overflow-hidden rounded-xl border border-white/[0.08]" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)", maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)" }}>
                    <Image alt="Discord Elite Privat - structura canalelor" className="w-full object-contain" height={500} src="https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/discord-sidebar.jpg" width={280} unoptimized />
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* 6. Alex's Brain AI Mentor */}
        <section className="py-12 md:py-20">
          <Container>
            <div className="mx-auto max-w-5xl">
              <AlexsBrainSection />
            </div>
          </Container>
        </section>

        {/* 7. Social Proof Stats */}
        <section className="py-12 md:py-20">
          <Container>
            <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-3">
              <ScrollReveal className="text-center">
                <p className="text-5xl font-bold text-white md:text-7xl">
                  <NumberTicker value={85} suffix="%" />
                </p>
                <p className="mt-4 text-sm text-slate-400">spun că au înțeles mai bine <span className="font-semibold text-white">piața</span> după primele <span className="font-semibold text-white">2 săptămâni</span></p>
              </ScrollReveal>
              <ScrollReveal className="text-center" delay={0.1}>
                <p className="text-5xl font-bold text-white md:text-7xl">
                  <NumberTicker value={70} suffix="%" />
                </p>
                <p className="mt-4 text-sm text-slate-400">spun că au evitat cel puțin o decizie proastă datorită <span className="font-semibold text-white">Risk Score</span>-ului</p>
              </ScrollReveal>
              <ScrollReveal className="text-center" delay={0.2}>
                <p className="text-5xl font-bold text-accent-emerald md:text-7xl">
                  <NumberTicker value={350} suffix="+" />
                </p>
                <p className="mt-4 text-sm text-slate-400">traderi activi care <span className="font-semibold text-white">învață</span> și <span className="font-semibold text-white">cresc împreună</span></p>
              </ScrollReveal>
            </div>
          </Container>
        </section>

        {/* 7.5. Feature Marquee - trust bar */}
        <section className="border-y border-white/5 bg-surface-graphite/40 py-6 backdrop-blur-sm">
          <Marquee speed={45}>
            {[
              "⚡ Risk Score săptămânal",
              "📊 55+ Video-uri Elite",
              "🎯 Indicatori TradingView exclusivi",
              "💬 Discord privat",
              "🔴 Sesiuni live cu Alex",
              "🆓 7 zile trial gratuit",
              "💳 Stripe + Crypto payments",
              "🚀 350+ Traderi activi",
              "📈 Track record public",
              "🧠 Alex's Brain AI mentor",
            ].map((item) => (
              <span key={item} className="whitespace-nowrap text-sm font-medium text-slate-300">
                {item}
                <span aria-hidden className="mx-6 text-white/10">•</span>
              </span>
            ))}
          </Marquee>
        </section>

        {/* 8. Testimonials */}
        <TestimonialsSection />

        {/* 9. Pricing */}
        <PricingSection />

        {/* 10. FAQ */}
        <FaqSection />

        {/* 11. Final CTA */}
        <section className="relative py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-emerald/5 to-transparent" />
          <Container className="relative text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Încă te gândești?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">
              Începe cu <span className="font-semibold text-white">7 zile gratuit</span>. <span className="font-semibold text-white">Fără card</span>, fără obligații. Dacă nu merită, nu plătești nimic.
            </p>
            <Link className="accent-button gradient-border-animated mt-8 inline-block rounded-xl px-10 py-4 text-lg font-bold" href="/signup">
              Începe Gratuit →
            </Link>
          </Container>
        </section>
      </main>

      {/* Footer */}
      <Footer />
      <TrialPopup />
    </>
  );
}

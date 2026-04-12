import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { AlexsBrainSection } from "@/components/marketing/alexs-brain-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const AboutSection = dynamic(() => import("@/components/marketing/about-section").then(m => m.AboutSection));
const BenefitsSection = dynamic(() => import("@/components/marketing/benefits-section").then(m => m.BenefitsSection));
const FaqSection = dynamic(() => import("@/components/marketing/faq-section").then(m => m.FaqSection));
const LeadMagnetSection = dynamic(() => import("@/components/marketing/lead-magnet-section").then(m => m.LeadMagnetSection));
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

  const features = [
    {
      label: "ANALIZA SAPTAMANALA",
      title: "Stii exact cand sa cumperi",
      desc: "Un scor de la 0 la 100 bazat pe Fear & Greed, distanta de ATH, sentiment si cicluri. Actualizat saptamanal.",
    },
    {
      label: "16 ACTIUNI MONITORIZATE",
      title: "Zone clare de Buy si Sell",
      desc: "Fiecare actiune cu 2 zone de cumparare si 2 zone de vanzare. Stii exact unde intri si unde iesi.",
    },
    {
      label: "TIMING RESEARCH",
      title: "9 metode. Un singur calendar.",
      desc: "Eclipse, Fibonacci, Gann, Halving, Blood Moon - toate analizate si combinate intr-un scor de convergenta.",
    },
    {
      label: "55+ VIDEO-URI",
      title: "De la zero la executie",
      desc: "Fiecare video te duce cu un pas mai aproape de consistenta. Analiza tehnica, risk management, psihologie.",
    },
    {
      label: "350+ TRADERI",
      title: "Nu mai tranzactionezi singur",
      desc: "Intreaba orice, primesti raspuns. Discutii zilnice, analize, si sesiuni live saptamanale cu Alex.",
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
      <Navbar mode="marketing" />
      <main>
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Live Data Strip */}
        <section className="py-4">
          <Container>
            <div className="glass-card mx-auto flex flex-wrap items-center justify-center gap-4 rounded-2xl px-6 py-3 text-xs md:gap-8">
              <span className="flex items-center gap-2">
                <span className="text-slate-400">Risk Score:</span>
                <span className={`font-mono font-bold ${riskScore >= 55 ? "text-accent-emerald" : riskScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>{riskScore}</span>
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${riskScore >= 55 ? "bg-accent-emerald/10 text-accent-emerald" : riskScore >= 40 ? "bg-yellow-400/10 text-yellow-400" : "bg-red-400/10 text-red-400"}`}>{riskDecision}</span>
              </span>
              {btcPrice > 0 && (<>
                <span className="hidden h-4 w-px bg-slate-700 sm:block" />
                <span className="flex items-center gap-2">
                  <span className="text-slate-400">BTC:</span>
                  <span className="font-mono font-bold text-white">${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                </span>
              </>)}
              {fearGreed > 0 && (<>
                <span className="hidden h-4 w-px bg-slate-700 sm:block" />
                <span className="flex items-center gap-2">
                  <span className="text-slate-400">Fear &amp; Greed:</span>
                  <span className={`font-mono font-bold ${fearGreed <= 25 ? "text-red-400" : fearGreed <= 50 ? "text-yellow-400" : "text-accent-emerald"}`}>{fearGreed}</span>
                </span>
              </>)}
              {pctAth < 0 && (<>
                <span className="hidden h-4 w-px bg-slate-700 sm:block" />
                <span className="flex items-center gap-2">
                  <span className="text-slate-400">Distanta ATH:</span>
                  <span className="font-mono font-bold text-red-400">{pctAth.toFixed(0)}%</span>
                </span>
              </>)}
            </div>
          </Container>
        </section>

        {/* 4. Feature Sections - Instrumentele Tale */}
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
                  <p className="text-slate-400">{features[0].desc}</p>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="glass-card flex h-48 w-48 flex-col items-center justify-center rounded-full border border-accent-emerald/30">
                    <span className="text-5xl font-bold text-accent-emerald">67</span>
                    <span className="mt-1 text-sm font-semibold uppercase tracking-wider text-accent-emerald/80">CUMPARA</span>
                  </div>
                </div>
              </div>

              {/* Feature 2: Stocks - preview left, text right */}
              <div className="flex flex-col-reverse items-center gap-10 md:flex-row">
                <div className="flex flex-1 items-center justify-center">
                  <div className="glass-card w-full max-w-xs space-y-2 rounded-2xl p-5">
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 text-xs text-slate-500">
                      <span>Actiune</span><span>Status</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="font-mono text-sm font-bold text-white">TSLA</span>
                      <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs font-semibold text-yellow-400">HOLD</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="font-mono text-sm font-bold text-white">MSFT</span>
                      <span className="rounded bg-accent-emerald/10 px-2 py-0.5 text-xs font-semibold text-accent-emerald">BUY</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="font-mono text-sm font-bold text-white">GOOG</span>
                      <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">SELL</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">{features[1].label}</p>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{features[1].title}</h3>
                  <p className="text-slate-400">{features[1].desc}</p>
                </div>
              </div>

              {/* Feature 3: Pivot Dashboard - text left, preview right */}
              <div className="flex flex-col items-center gap-10 md:flex-row">
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">{features[2].label}</p>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{features[2].title}</h3>
                  <p className="text-slate-400">{features[2].desc}</p>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="glass-card w-full max-w-xs space-y-4 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Convergenta Pivoti</span>
                      <span className="font-mono text-xs text-accent-emerald">3/9</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                      <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-accent-emerald to-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-500">3 metode active din 9 analizate</p>
                  </div>
                </div>
              </div>

              {/* Feature 4: Educatie - preview left, text right */}
              <div className="flex flex-col-reverse items-center gap-10 md:flex-row">
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex w-full max-w-xs gap-2">
                    <div className="glass-card flex-1 space-y-2 rounded-xl p-3">
                      <div className="flex h-16 items-center justify-center rounded-lg bg-accent-emerald/5 text-2xl">📊</div>
                      <p className="text-[11px] font-medium leading-tight text-slate-300">Fibonacci Retracement</p>
                    </div>
                    <div className="glass-card flex-1 space-y-2 rounded-xl p-3">
                      <div className="flex h-16 items-center justify-center rounded-lg bg-accent-emerald/5 text-2xl">🧠</div>
                      <p className="text-[11px] font-medium leading-tight text-slate-300">Psihologia Tradingului</p>
                    </div>
                    <div className="glass-card flex-1 space-y-2 rounded-xl p-3">
                      <div className="flex h-16 items-center justify-center rounded-lg bg-accent-emerald/5 text-2xl">⚖️</div>
                      <p className="text-[11px] font-medium leading-tight text-slate-300">Risk Management</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">{features[3].label}</p>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{features[3].title}</h3>
                  <p className="text-slate-400">{features[3].desc}</p>
                </div>
              </div>

              {/* Feature 5: Comunitate - text left, preview right */}
              <div className="flex flex-col items-center gap-10 md:flex-row">
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">{features[4].label}</p>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{features[4].title}</h3>
                  <p className="text-slate-400">{features[4].desc}</p>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="glass-card w-full max-w-xs space-y-3 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">A</div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-indigo-400">Alex</p>
                        <p className="rounded-lg rounded-tl-none bg-slate-800 px-3 py-2 text-xs text-slate-300">BTC arata bine pe weekly. Zona de buy intre 80-82k.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">M</div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-emerald-400">Mihai</p>
                        <p className="rounded-lg rounded-tl-none bg-slate-800 px-3 py-2 text-xs text-slate-300">Multumesc! Am intrat cu DCA la 81k.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Alex's Brain AI Mentor */}
        <section className="py-12 md:py-20">
          <Container>
            <div className="mx-auto max-w-5xl">
              <AlexsBrainSection />
            </div>
          </Container>
        </section>

        {/* 5. Social Proof Stats */}
        <section className="py-12 md:py-20">
          <Container>
            <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-3">
              <div className="text-center">
                <p className="text-5xl font-bold text-white md:text-7xl">85%</p>
                <p className="mt-4 text-sm text-slate-400">spun ca au inteles mai bine piata dupa primele 2 saptamani</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-white md:text-7xl">70%</p>
                <p className="mt-4 text-sm text-slate-400">spun ca au evitat cel putin o decizie proasta datorita Risk Score-ului</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-accent-emerald md:text-7xl">350+</p>
                <p className="mt-4 text-sm text-slate-400">traderi activi care invata si cresc impreuna</p>
              </div>
            </div>
          </Container>
        </section>

        {/* 6. Track Record Teaser */}
        <section className="py-12 md:py-20" style={{ background: "linear-gradient(180deg, transparent, rgba(239,68,68,0.02) 50%, transparent)" }}>
          <Container>
            <div className="mx-auto max-w-4xl text-center">
              <p className="section-label mb-3">TRACK RECORD PUBLIC</p>
              <h2 className="text-2xl font-bold text-white md:text-4xl">
                Am iesit din piata inainte de crash-ul din Octombrie 2025.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 md:text-base">
                Fiecare decizie documentata pe Discord, cu timestamp imuabil. De la 55% cash in August la 100% USDC pe 30 Octombrie - inainte ca piata sa piarda -60%.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  { img: "/track-record/04-aug25-92pct-usdt-avertizare.jpg", caption: "25 Aug - 92% USDT - 'Aveti mare grija'" },
                  { img: "/track-record/09-oct10-crash-vandut-tot.jpg", caption: "10 Oct - 'Am vandut tot' - 'E bearmarket'" },
                  { img: "/track-record/12-oct12-dead-cat-bounce-99pct.jpg", caption: "12 Oct - 99.99% USDC - 'Dead cat bounce'" },
                ].map((s) => (
                  <div key={s.caption} className="overflow-hidden rounded-xl border border-white/5">
                    <Image alt={s.caption} className="w-full" height={300} src={s.img} width={500} />
                  </div>
                ))}
              </div>
              <Link className="ghost-button mt-8 inline-block" href="/track-record">
                Vezi tot Track Record-ul →
              </Link>
            </div>
          </Container>
        </section>

        {/* 7. About */}
        <AboutSection />

        {/* 7. Benefits */}
        <BenefitsSection />

        {/* 8. How It Works */}
        <section className="py-20" id="cum-functioneaza">
          <Container>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Simplu și rapid</p>
              <h2 className="text-3xl font-bold text-white md:text-4xl">Cum <span className="gradient-text">funcționează</span></h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-400">De la signup la acces complet - în mai puțin de 5 minute.</p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-6 grid-cols-2 md:gap-8 md:grid-cols-4">
              {[
                { step: "1", icon: "📝", title: "Creează cont", desc: "Signup gratuit cu 7 zile trial. Fără card." },
                { step: "2", icon: "💬", title: "Intră pe Discord", desc: "Conectează Discord și primești rolul Elite automat." },
                { step: "3", icon: "📊", title: "Explorează resursele", desc: "Analize, portofoliu Elite, video-uri educaționale și ghiduri." },
                { step: "4", icon: "🚀", title: "Învață și investește", desc: "Analizează chart-urile, cere sfaturi și aplică ce înveți." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 text-2xl">{item.icon}</div>
                  <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-emerald text-sm font-bold text-crypto-dark">{item.step}</div>
                  <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* 9. Trial CTA */}
        <LeadMagnetSection />

        {/* 10. Pricing */}
        <PricingSection />

        {/* 11. Testimonials */}
        <TestimonialsSection />

        {/* 12. FAQ */}
        <FaqSection />

        {/* 13. Final CTA */}
        <section className="relative py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-emerald/5 to-transparent" />
          <Container className="relative text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Inca te gandesti?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">
              Incepe cu 7 zile gratuit. Fara card, fara obligatii. Daca nu merita, nu platesti nimic.
            </p>
            <Link className="accent-button mt-8 inline-block px-10 py-4 text-lg font-bold" href="/signup">
              Incepe Gratuit →
            </Link>
          </Container>
        </section>
      </main>

      {/* 14. Footer */}
      <Footer />
      <TrialPopup />
    </>
  );
}

import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { HeroSection } from "@/components/marketing/hero-section";
import { StatsSection } from "@/components/marketing/stats-section";

const AboutSection = dynamic(() => import("@/components/marketing/about-section").then(m => m.AboutSection));
const BenefitsSection = dynamic(() => import("@/components/marketing/benefits-section").then(m => m.BenefitsSection));
const CtaSection = dynamic(() => import("@/components/marketing/cta-section").then(m => m.CtaSection));
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

export default function HomePage() {
  const organizationSchema = getHomepageOrganizationSchema();
  const faqSchema = getHomepageFaqSchema();

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
        <HeroSection />
        <StatsSection />
        <AboutSection />
        <BenefitsSection />
        {/* How It Works */}
        <section className="py-20" id="cum-functioneaza">
          <Container>
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Simplu și rapid</p>
              <h2 className="text-3xl font-bold text-white md:text-4xl">Cum <span className="gradient-text">funcționează</span></h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-400">De la signup la acces complet - în mai puțin de 5 minute.</p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-4">
              {[
                { step: "1", icon: "📝", title: "Creează cont", desc: "Signup gratuit cu 3 zile trial. Fără card." },
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
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
      <TrialPopup />
    </>
  );
}

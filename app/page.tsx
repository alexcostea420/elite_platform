import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { StatsSection } from "@/components/marketing/stats-section";

const AboutSection = dynamic(() => import("@/components/marketing/about-section").then(m => m.AboutSection));
const BenefitsSection = dynamic(() => import("@/components/marketing/benefits-section").then(m => m.BenefitsSection));
const CtaSection = dynamic(() => import("@/components/marketing/cta-section").then(m => m.CtaSection));
const FaqSection = dynamic(() => import("@/components/marketing/faq-section").then(m => m.FaqSection));
const PricingSection = dynamic(() => import("@/components/marketing/pricing-section").then(m => m.PricingSection));
const TestimonialsSection = dynamic(() => import("@/components/marketing/testimonials-section").then(m => m.TestimonialsSection));
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
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}

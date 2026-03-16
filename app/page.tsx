import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AboutSection } from "@/components/marketing/about-section";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
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

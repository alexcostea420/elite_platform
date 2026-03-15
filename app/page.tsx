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

export default function HomePage() {
  return (
    <>
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

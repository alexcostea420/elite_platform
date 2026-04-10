import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { benefits } from "@/lib/constants/site";

export function BenefitsSection() {
  return (
    <section className="px-4 py-20" id="beneficii">
      <Container>
        <SectionHeading title={<>Ce primesti ca <span className="gradient-text">Membru Elite</span></>} description="Tot ce ai nevoie pentru a investi si tranzactiona cu incredere" />
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, i) => (
            <article key={benefit.title} className={`panel card-hover p-8 animate-fade-in-up stagger-${i + 1}`}>
              <div className="text-5xl">{benefit.icon}</div>
              <h3 className="mt-4 text-2xl font-bold text-accent-emerald">{benefit.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-300">{benefit.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

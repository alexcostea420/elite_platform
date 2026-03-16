import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { testimonials } from "@/lib/constants/site";

export function TestimonialsSection() {
  return (
    <section className="bg-surface-graphite/30 px-4 py-20" id="testimoniale">
      <Container>
        <SectionHeading title={<>Ce spun <span className="gradient-text">Membrii Noștri</span></>} description="50+ Elite mulțumiți" />
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="panel p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-emerald text-2xl">👤</div>
                <div>
                  <h3 className="font-bold text-white">{testimonial.name}</h3>
                  <p className="text-sm text-accent-emerald">{testimonial.meta}</p>
                </div>
              </div>
              <div className="mt-4 text-accent-emerald">★★★★★</div>
              <p className="mt-3 italic leading-relaxed text-slate-300">“{testimonial.quote}”</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

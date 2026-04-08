import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { testimonials } from "@/lib/constants/site";

export function TestimonialsSection() {
  return (
    <section className="px-4 py-20" id="testimoniale">
      <Container>
        <SectionHeading title={<>Ce spun <span className="gradient-text">Membrii Nostri</span></>} description="Review-uri reale de pe Discord" />
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="panel p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-emerald text-lg font-bold text-crypto-dark">{testimonial.name.charAt(0)}</div>
                <div>
                  <h3 className="font-bold text-white">{testimonial.name}</h3>
                  <p className="text-sm text-accent-emerald">{testimonial.meta}</p>
                </div>
              </div>
              <div className="mt-4 text-accent-emerald">★★★★★</div>
              <p className="mt-3 italic leading-relaxed text-slate-300">&ldquo;{testimonial.quote}&rdquo;</p>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">Nu ne crezi pe cuvant? Intra pe Discord si vorbeste direct cu membrii Elite.</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <a className="ghost-button text-sm" href="https://discord.gg/ecNNcV5GD9" rel="noreferrer" target="_blank">Intra pe Discord</a>
            <a className="accent-button text-sm" href="/signup">Incearca Gratis 3 Zile</a>
          </div>
        </div>
      </Container>
    </section>
  );
}

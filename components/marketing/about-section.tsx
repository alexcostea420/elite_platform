import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/constants/site";

const bulletPoints = [
  "Sesiuni live de trading săptămânale",
  "Indicator ELITE exclusiv pentru TradingView",
  "Comunitate Discord dedicată"
];

export function AboutSection() {
  return (
    <section className="px-4 py-20" id="despre">
      <Container>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="rounded-[1.75rem] bg-emerald-gradient p-[1px] shadow-glow">
              <div className="flex min-h-[360px] items-center justify-center rounded-[1.7rem] bg-surface-graphite p-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-accent-emerald text-6xl">👨‍💼</div>
                  <h3 className="text-2xl font-bold text-white">{siteConfig.creator}</h3>
                  <p className="mt-2 text-accent-emerald">Trader & Educator</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <SectionHeading align="left" title={<>Despre <span className="gradient-text">{siteConfig.creator}</span></>} />
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              Trader experimentat cu 350+ membri activi în comunitate și 50+ Elite. Alex împărtășește strategii practice de trading crypto și oferă acces la indicatori exclusivi pentru TradingView.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              Cu sesiuni live de trading, analize săptămânale detaliate și o comunitate activă pe Discord, Armata de Traderi este locul unde învățarea devine execuție reală.
            </p>
            <div className="mt-6 space-y-3">
              {bulletPoints.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="text-2xl text-crypto-green">✓</span>
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

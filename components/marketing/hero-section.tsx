import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/constants/site";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-32">
      <div className="absolute inset-0 bg-hero-radial opacity-90" />
      <div className="absolute inset-0 grid-glow opacity-20" />
      <Container className="relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-accent-emerald/30 bg-surface-graphite px-4 py-2">
            <span className="font-semibold text-accent-emerald">🎯 300+ membri activi · 46+ Elite</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight text-white md:text-7xl">
            Învață să tranzacționezi
            <br />
            <span className="gradient-text">ca un profesionist</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-slate-300 md:text-2xl">
            Alătură-te comunității de traderi condusă de {siteConfig.creator}. Acces live la sesiuni de trading, indicatori exclusivi ELITE și analize săptămânale.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link className="accent-button px-8 py-4 text-lg font-bold" href="#preturi">
              Începe Acum →
            </Link>
            <a className="ghost-button px-8 py-4 text-lg font-bold" href={siteConfig.youtubeUrl} rel="noreferrer" target="_blank">
              🎥 Vezi pe YouTube
            </a>
          </div>
          <p className="mt-8 text-sm text-slate-500">✨ Peste 46 membri Elite · Indicator TradingView inclus</p>
        </div>
      </Container>
    </section>
  );
}

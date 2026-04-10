import Link from "next/link";

import { Container } from "@/components/ui/container";

export function LeadMagnetSection() {
  return (
    <section className="relative overflow-hidden py-20" id="trial-gratuit">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-emerald/5 to-transparent" />

      <Container className="relative">
        <div className="mx-auto max-w-3xl rounded-3xl border border-accent-emerald/20 bg-surface-graphite/80 p-8 text-center backdrop-blur-sm md:p-12">
          <div className="mb-4 text-4xl">🪖</div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
            7 zile gratuit
          </p>
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Testeaza totul. Fara card. Fara obligatii.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-400">
            Acces complet la Discord Elite, video-uri, indicatori, analize si portofoliul live.
            Dupa 7 zile decizi daca merita.
          </p>

          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              className="accent-button rounded-xl px-8 py-4 text-center text-base font-bold"
              href="/signup"
            >
              Creeaza Cont Gratuit →
            </Link>
          </div>

          <div className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span>Fara card de credit</span>
            <span>Se anuleaza automat</span>
            <span>Acces complet</span>
          </div>
        </div>
      </Container>
    </section>
  );
}

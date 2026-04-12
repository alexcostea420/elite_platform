import Link from "next/link";

import { Container } from "@/components/ui/container";

export function CtaSection() {
  return (
    <section className="bg-gradient-to-br from-surface-graphite via-crypto-dark to-black px-4 py-20">
      <Container className="max-w-4xl text-center">
        <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
          Gata să faci primul pas spre <span className="gradient-text">trading consistent</span>?
        </h2>
        <p className="mt-6 text-lg text-slate-300 sm:text-xl">350+ membri activi. 50+ Elite. Rezultate reale, nu promisiuni.</p>
        <Link className="accent-button mt-8 px-10 py-5 text-lg font-bold sm:text-xl" href="/signup">
          Începe Gratuit - 7 Zile →
        </Link>
        <p className="mt-6 text-sm text-slate-500">Fără card de credit. Cont activ în 2 minute.</p>
      </Container>
    </section>
  );
}

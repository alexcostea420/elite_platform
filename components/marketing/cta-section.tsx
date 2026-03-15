import Link from "next/link";

import { Container } from "@/components/ui/container";

export function CtaSection() {
  return (
    <section className="bg-gradient-to-br from-surface-graphite via-crypto-dark to-black px-4 py-20">
      <Container className="max-w-4xl text-center">
        <h2 className="text-4xl font-bold leading-tight text-white md:text-5xl">
          Gata să începi călătoria ta în <span className="gradient-text">trading crypto</span>?
        </h2>
        <p className="mt-6 text-xl text-slate-300">Alătură-te celor 46+ membri Elite și începe să tranzacționezi ca un profesionist</p>
        <Link className="accent-button mt-8 px-10 py-5 text-xl font-bold" href="#preturi">
          Alătură-te Acum →
        </Link>
        <p className="mt-6 text-sm text-slate-500">✨ Începe în mai puțin de 2 minute</p>
      </Container>
    </section>
  );
}

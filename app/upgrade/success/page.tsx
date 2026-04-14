import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Plată confirmată | Armata de Traderi",
  robots: "noindex",
};

export default function StripeSuccessPage() {
  return (
    <>
      <Navbar mode="dashboard" />
      <main className="flex min-h-screen items-center justify-center bg-surface-night px-4 py-24">
        <Container className="max-w-lg text-center">
          <div className="text-6xl">✅</div>
          <h1 className="mt-6 font-display text-3xl font-bold text-white">
            Plata confirmată!
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Accesul tău Elite a fost activat. Bine ai venit în Armata de Traderi!
          </p>

          <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
            <p className="text-base font-semibold text-white">Conectează Discord</p>
            <p className="mt-2 text-sm text-slate-400">
              Primești automat rolul Elite și acces la canalele private.
            </p>
            <a
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4752C4]"
              href="/auth/discord/start"
            >
              Conectează Discord
            </a>
          </div>

          <Link
            className="mt-4 inline-block text-sm text-slate-500 underline hover:text-slate-300"
            href="/dashboard"
          >
            Mergi la Dashboard
          </Link>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}

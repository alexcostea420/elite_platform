import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";

import { CardCheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Plată cu cardul | Armata de Traderi",
  robots: "noindex",
};

export default function CardPayPage() {
  return (
    <>
      <Navbar mode="dashboard" />
      <main className="min-h-screen bg-surface-night pt-24 pb-16">
        <Container className="max-w-5xl">
          <header className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
              Upgrade · Plată cu cardul
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Finalizează abonamentul
            </h1>
          </header>

          <CardCheckoutClient />

          <p className="mt-6 text-center text-xs text-slate-500">
            Plățile sunt procesate securizat de Stripe. Datele cardului tău nu
            trec prin serverele noastre.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}

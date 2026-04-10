import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { signupAction } from "@/app/auth/actions";
import { buildPageMetadata } from "@/lib/seo";

type SignupPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

export const metadata: Metadata = buildPageMetadata({
  title: "Creează Cont Trading Crypto | Intră în Comunitate",
  description:
    "Creează contul tău pentru comunitatea trading crypto din România și intră în platforma cu video-uri, resurse și acces la Elite.",
  keywords: [
    "signup trading crypto",
    "comunitate crypto romania",
    "cont traderi romania",
    "platforma trading crypto",
    "inregistrare elite trading",
  ],
  path: "/signup",
  host: "app",
  index: false,
});

export default function SignupPage({ searchParams }: SignupPageProps) {
  const error = searchParams?.error;
  const message = searchParams?.message;

  return (
    <>
      <Navbar mode="marketing" />
      <main className="pb-16 pt-28">
        <Container className="max-w-xl">
          <section className="panel px-6 py-8 md:px-8">
            <div className="mb-8 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Înregistrare
              </p>
              <h1 className="text-4xl font-bold text-white">Creează-ți contul</h1>
              <p className="mt-3 text-slate-400">
                Fă primul pas pentru a accesa dashboard-ul și viitorul conținut premium.
              </p>
            </div>

            {message ? (
              <div className="mb-4 rounded-xl border border-crypto-green/30 bg-crypto-green/10 px-4 py-3 text-sm text-slate-100">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <form action={signupAction} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="full_name">
                  Nume complet
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  id="full_name"
                  name="full_name"
                  placeholder="Numele tău complet"
                  required
                  type="text"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="discord_username">
                  Username Discord
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  id="discord_username"
                  name="discord_username"
                  placeholder="exemplu: alexcostea"
                  required
                  type="text"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
                  Email
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  id="email"
                  name="email"
                  placeholder="nume@email.com"
                  required
                  type="email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
                  Parolă
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  id="password"
                  name="password"
                  placeholder="Alege o parolă"
                  required
                  type="password"
                />
              </div>
              <button className="accent-button w-full py-3.5 text-base font-bold" type="submit">
                Creează cont gratuit →
              </button>
              <p className="mt-2 text-center text-xs text-slate-500">
                7 zile acces complet gratuit. Fara card de credit.
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Ai deja cont?{" "}
              <Link className="font-semibold text-accent-emerald hover:text-crypto-green" href="/login">
                Intră în cont
              </Link>
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}

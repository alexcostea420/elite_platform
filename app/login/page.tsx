import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { loginAction } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error;
  const message = searchParams?.message;
  const nextPath = searchParams?.next ?? "/dashboard";

  return (
    <>
      <Navbar mode="marketing" />
      <main className="pb-16 pt-28">
        <Container className="max-w-xl">
          <section className="panel px-6 py-8 md:px-8">
            <div className="mb-8 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Autentificare
              </p>
              <h1 className="text-4xl font-bold text-white">Intră în contul tău</h1>
              <p className="mt-3 text-slate-400">
                Accesează dashboard-ul Armata de Traderi și conținutul protejat.
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

            <form action={loginAction} className="space-y-4">
              <input name="next" type="hidden" value={nextPath} />
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
                  placeholder="Introdu parola"
                  required
                  type="password"
                />
              </div>
              <button className="accent-button w-full" type="submit">
                Intră în cont
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Nu ai cont?{" "}
              <Link className="font-semibold text-accent-emerald hover:text-crypto-green" href="/signup">
                Creează unul acum
              </Link>
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}

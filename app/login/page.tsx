import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
    next?: string;
  };
};

export const metadata: Metadata = buildPageMetadata({
  title: "Login Elite Trading | Cont Comunitate Crypto",
  description:
    "Intră în contul tău Elite Trading pentru a accesa dashboard-ul, biblioteca video și comunitatea crypto din platformă.",
  keywords: [
    "login trading crypto",
    "cont comunitate crypto",
    "autentificare elite trading",
    "dashboard traderi romania",
    "platforma trading crypto",
  ],
  path: "/login",
  host: "app",
  index: false,
});

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
            <LoginForm error={error} message={message} nextPath={nextPath} />
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}

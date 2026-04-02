"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-crypto-dark px-4 text-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-xl">
        <div className="text-6xl">⚠️</div>
        <h1 className="mt-6 text-3xl font-bold text-white">Ceva nu a funcționat</h1>
        <p className="mt-4 max-w-md text-slate-400">
          A apărut o eroare neașteptată. Încearcă din nou sau revino la pagina principală.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            className="rounded-xl bg-accent-emerald px-6 py-3 font-semibold text-crypto-dark transition hover:bg-accent-soft"
            onClick={reset}
            type="button"
          >
            Încearcă din nou
          </button>
          <Link
            className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/5"
            href="/dashboard"
          >
            Înapoi la Dashboard
          </Link>
          <Link
            className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
            href="/"
          >
            Pagina principală
          </Link>
        </div>
      </div>
    </div>
  );
}

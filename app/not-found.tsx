import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-crypto-dark px-4 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-6 text-3xl font-bold text-white">Pagina nu a fost găsită</h1>
      <p className="mt-4 max-w-md text-slate-400">
        Pagina pe care o cauți nu există sau a fost mutată.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          className="rounded-xl bg-accent-emerald px-6 py-3 font-semibold text-crypto-dark hover:bg-accent-soft"
          href="/"
        >
          Pagina principală
        </Link>
        <Link
          className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/5"
          href="/dashboard"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}

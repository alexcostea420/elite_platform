import Link from "next/link";

export function BotLock({ isElite }: { isElite: boolean }) {
  return (
    <section className="panel border-purple-400/20 p-8 text-center md:p-12">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-purple-400/30 bg-purple-400/10">
        <span className="text-4xl">🤖</span>
      </div>
      <h2 className="text-3xl font-bold text-white">Acces Bot Trading</h2>
      <p className="mx-auto mt-4 max-w-lg text-slate-300">
        Semnalele ML, performanța și strategiile active sunt disponibile cu abonamentul Bot.
      </p>
      <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5">
        {isElite ? (
          <>
            <p className="text-sm text-slate-400">Preț pentru membri Elite:</p>
            <p className="mt-1 text-3xl font-bold text-purple-400">$45<span className="text-lg text-slate-500">/lună</span></p>
            <p className="mt-1 text-xs text-green-400">Economisești $54/lună față de prețul standard</p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-400">Preț standalone:</p>
            <p className="mt-1 text-3xl font-bold text-purple-400">$99<span className="text-lg text-slate-500">/lună</span></p>
            <p className="mt-2 text-xs text-slate-500">Cu Elite activ: doar $45/lună</p>
          </>
        )}
      </div>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link className="accent-button" href="/upgrade">
          Activează Bot
        </Link>
        <Link className="ghost-button" href="/dashboard">
          Înapoi la Dashboard
        </Link>
      </div>
    </section>
  );
}

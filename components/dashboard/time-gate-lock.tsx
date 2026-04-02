import Link from "next/link";

export function TimeGateLock({
  daysRemaining,
  featureName,
}: {
  daysRemaining: number;
  featureName: string;
}) {
  return (
    <section className="panel border-yellow-400/20 p-8 text-center md:p-12">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/10">
        <span className="text-4xl">🔒</span>
      </div>
      <h2 className="text-3xl font-bold text-white">{featureName}</h2>
      <p className="mx-auto mt-4 max-w-lg text-slate-300">
        Această secțiune se deblochează după 31 de zile de membership Elite.
        Mai ai <span className="font-bold text-yellow-400">{daysRemaining} zile</span> până la acces.
      </p>
      <div className="mx-auto mt-6 max-w-xs">
        <div className="mb-2 flex justify-between text-xs text-slate-500">
          <span>Progres</span>
          <span>{31 - daysRemaining}/31 zile</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-yellow-400"
            style={{ width: `${((31 - daysRemaining) / 31) * 100}%` }}
          />
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-lg text-sm text-slate-500">
        Continuă-ți membership-ul și vei primi acces automat. Între timp, explorează restul platformei.
      </p>
      <div className="mt-6">
        <Link className="ghost-button" href="/dashboard">
          Înapoi la Dashboard
        </Link>
      </div>
    </section>
  );
}

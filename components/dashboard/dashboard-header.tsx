type DashboardHeaderProps = {
  firstName: string;
  membershipLabel: string;
  statusLabel: string;
};

export function DashboardHeader({ firstName, membershipLabel, statusLabel }: DashboardHeaderProps) {
  const today = new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <section className="mb-8 rounded-[1.75rem] border border-white/10 bg-white/5 px-6 py-8 shadow-card md:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
            {today}
          </p>
          <h1 className="text-4xl font-bold text-white">
            Bine ai venit înapoi, <span className="gradient-text">{firstName}</span>! 👋
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Ai tot ce îți trebuie într-un singur loc: statusul accesului, conținutul nou și pașii următori pentru progresul tău.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-2 text-sm font-semibold text-accent-emerald">
            {membershipLabel}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
            {statusLabel}
          </span>
        </div>
      </div>
    </section>
  );
}

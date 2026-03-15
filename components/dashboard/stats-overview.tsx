import { dashboardStats } from "@/lib/constants/site";

export function StatsOverview() {
  return (
    <section className="mb-8 grid gap-6 md:grid-cols-3">
      {dashboardStats.map((stat) => (
        <article key={stat.title} className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-400">{stat.title}</h3>
            <div className="text-2xl">{stat.icon}</div>
          </div>
          <div className={`mb-2 text-4xl font-bold ${stat.tone === "green" ? "text-crypto-green" : "text-accent-emerald"}`}>{stat.value}</div>
          <div className="h-2 w-full rounded-full bg-slate-700">
            <div className={`h-2 rounded-full ${stat.tone === "green" ? "bg-crypto-green" : "bg-accent-emerald"}`} style={{ width: `${stat.progress}%` }} />
          </div>
        </article>
      ))}
    </section>
  );
}

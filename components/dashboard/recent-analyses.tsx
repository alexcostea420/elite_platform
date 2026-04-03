import { recentAnalyses } from "@/lib/constants/site";

function sentimentClass(tone: string) {
  if (tone === "green") {
    return "bg-crypto-green/20 text-crypto-green";
  }

  return "bg-white/10 text-slate-300";
}

export function RecentAnalyses() {
  return (
    <section id="analize">
      <h2 className="mb-4 flex items-center text-2xl font-bold">
        <span className="gradient-text">Analize Recente</span>
        <span className="ml-3 rounded-full bg-accent-emerald px-2 py-1 text-sm font-semibold text-crypto-dark">Nou</span>
      </h2>
      <div className="space-y-4">
        {recentAnalyses.map((analysis) => (
          <article key={analysis.title} className={`card-hover rounded-xl p-6 ${analysis.featured ? "border border-accent-emerald bg-surface-graphite" : "panel"}`}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">{analysis.title}</h3>
                <p className="text-sm text-slate-400">{analysis.published}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${sentimentClass(analysis.sentimentTone)}`}>{analysis.sentiment}</span>
            </div>
            <p className="mb-4 text-slate-300">{analysis.summary}</p>
            <a className="font-semibold text-accent-emerald hover:text-crypto-green" href="/dashboard/risk-score">
              Citește analiza completă →
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

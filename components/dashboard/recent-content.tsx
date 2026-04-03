import { recentVideos } from "@/lib/constants/site";

function videoToneClass(tone: string) {
  if (tone === "green") {
    return "from-emerald-500 to-emerald-300/70";
  }

  if (tone === "slate") {
    return "from-slate-600 to-slate-500/60";
  }

  return "from-crypto-green to-accent-soft";
}

export function RecentContent() {
  return (
    <section id="continut">
      <h2 className="mb-4 text-2xl font-bold">
        <span className="gradient-text">Conținut Recent</span>
      </h2>
      <div className="rounded-xl border border-accent-emerald bg-gradient-to-br from-crypto-green/18 to-crypto-ink p-6 shadow-glow">
        <div className="flex items-center">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-emerald text-2xl">🔴</div>
          <div>
            <h3 className="text-lg font-bold text-white">Sesiuni Live</h3>
            <p className="text-slate-300">Urmărește anunțurile pe Discord</p>
          </div>
        </div>
        <p className="mt-4 text-slate-300">
          <strong>Topic:</strong> Analiză de piață BTC/ETH + Strategii pentru săptămâna viitoare
        </p>
        <a href="https://discord.gg/armatadetraderi" target="_blank" rel="noopener noreferrer" className="mt-4 block w-full rounded-xl bg-accent-emerald px-6 py-3 text-center font-bold text-crypto-dark hover:bg-accent-soft">Intră pe Discord</a>
      </div>
      <div className="mt-6">
        <h3 className="mb-3 text-lg font-semibold text-white">📚 Video-uri Noi</h3>
        <div className="space-y-4">
          {recentVideos.map((video) => (
            <article key={video.title} className="panel card-hover flex items-center p-4">
              <div className={`mr-4 flex h-16 w-24 items-center justify-center rounded-lg bg-gradient-to-br text-2xl ${videoToneClass(video.tone)}`}>
                ▶️
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{video.title}</h4>
                <p className="text-sm text-slate-400">{video.meta}</p>
              </div>
            </article>
          ))}
        </div>
        <a className="mt-4 block text-center font-semibold text-accent-emerald hover:text-crypto-green" href="/dashboard/videos">
          Vezi toate video-urile →
        </a>
      </div>
    </section>
  );
}

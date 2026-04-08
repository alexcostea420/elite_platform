import Link from "next/link";

import { getRiskScoreV2, getRiskScore } from "@/lib/trading-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function fmt(num: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
}

export async function MiniDashboard() {
  // Fetch risk score for live data
  const riskScore = await getRiskScoreV2() ?? await getRiskScore();

  // Fetch latest video
  let latestVideo: { title: string; youtube_id: string } | null = null;
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("videos")
      .select("title, youtube_id")
      .eq("is_published", true)
      .order("upload_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    latestVideo = data;
  } catch {
    // ignore
  }

  const score = riskScore?.score ?? 0;
  const decision = riskScore?.decision ?? "HOLD";
  const btcPrice = riskScore?.btc_price_live ?? riskScore?.btc_price ?? 0;
  const fgValue = riskScore?.fear_greed?.value ?? 50;
  const fgLabel = riskScore?.fear_greed?.label ?? "Neutral";
  const change24h = riskScore?.btc_24h_change ?? 0;

  const decisionLabel = decision === "BUY" ? "CUMPARA" : decision === "SELL" ? "VINDE" : "ASTEAPTA";
  const decisionColor = decision === "BUY" ? "text-emerald-400" : decision === "SELL" ? "text-red-400" : "text-amber-400";
  const scoreColor = score >= 51 ? "text-emerald-400" : score >= 31 ? "text-amber-400" : "text-red-400";
  const fgColor = fgValue <= 25 ? "text-red-400" : fgValue <= 50 ? "text-amber-400" : "text-emerald-400";
  const changeColor = change24h >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <section className="mb-8">
      {/* 4 metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Risk Score */}
        <Link href="/dashboard/risk-score" className="glass-card group p-5 transition-all hover:border-white/15">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Risk Score</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`font-data text-3xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-sm text-[var(--text-muted)]">/100</span>
          </div>
          <p className={`mt-1 text-xs font-semibold ${decisionColor}`}>{decisionLabel}</p>
        </Link>

        {/* BTC Price */}
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">BTC Pret</p>
          <p className="mt-2 font-data text-3xl font-bold text-white">${fmt(btcPrice)}</p>
          <p className={`mt-1 text-xs font-semibold ${changeColor}`}>
            {change24h >= 0 ? "+" : ""}{change24h.toFixed(1)}% 24h
          </p>
        </div>

        {/* Fear & Greed */}
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Frica & Lacomie</p>
          <p className={`mt-2 font-data text-3xl font-bold ${fgColor}`}>{fgValue}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{fgLabel}</p>
        </div>

        {/* Latest Video */}
        {latestVideo ? (
          <Link href={`/dashboard/videos?video=${latestVideo.youtube_id}`} className="glass-card group p-5 transition-all hover:border-white/15">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Ultimul Video</p>
            <p className="mt-2 text-sm font-semibold text-white line-clamp-2 group-hover:text-accent-emerald">
              {latestVideo.title}
            </p>
            <p className="mt-2 text-xs text-accent-emerald">Vizualizeaza &rarr;</p>
          </Link>
        ) : (
          <Link href="/dashboard/videos" className="glass-card group p-5 transition-all hover:border-white/15">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">Video-uri</p>
            <p className="mt-2 text-sm font-semibold text-white">55+ video-uri</p>
            <p className="mt-2 text-xs text-accent-emerald">Biblioteca &rarr;</p>
          </Link>
        )}
      </div>
    </section>
  );
}

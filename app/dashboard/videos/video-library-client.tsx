"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { VideoTemplateThumbnail } from "@/components/ui/video-thumbnail";

const VIEWED_KEY = "video-library-viewed-ids";

function readViewed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeViewed(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VIEWED_KEY, JSON.stringify([...ids]));
  } catch {}
}

type VideoRow = {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string;
  tags: string[] | null;
  tier_required: "free" | "elite";
  duration_seconds: number | null;
  thumbnail_url: string | null;
  upload_date: string;
  r2_url: string | null;
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function renderInlineBold(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-slate-200">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

function SummaryContent({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: Array<{ type: "p" | "ul"; items: string[] }> = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^(?:\*\s+|-\s+|•\s+)(.+)$/);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last && last.type === "ul") last.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
    } else {
      blocks.push({ type: "p", items: [line] });
    }
  }
  return (
    <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-slate-400">
      {blocks.map((block, idx) => {
        if (block.type === "ul") {
          return (
            <ul key={idx} className="space-y-1.5 pl-1">
              {block.items.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-accent-emerald" />
                  <span>{renderInlineBold(item, `b-${idx}-${i}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={idx}>{renderInlineBold(block.items[0], `p-${idx}`)}</p>;
      })}
    </div>
  );
}

function summaryFirstLine(text: string): string {
  const stripped = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.match(/^(\*\s+|-\s+|•\s+)/));
  if (!stripped) return text.split("\n")[0];
  return stripped.replace(/\*\*/g, "");
}

function isNew(uploadDate: string): boolean {
  const diff = Date.now() - new Date(uploadDate).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

export function VideoLibraryClient({
  videos,
  selectedVideoId,
  userTier,
  isAdmin = false,
}: {
  videos: VideoRow[];
  selectedVideoId: string | null;
  userTier: "free" | "elite" | null;
  isAdmin?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [showUnwatchedOnly, setShowUnwatchedOnly] = useState(false);
  const [showOldVideos, setShowOldVideos] = useState(false);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [thumbPrompt, setThumbPrompt] = useState<{ title: string; prompt: string } | null>(null);
  const [thumbLoading, setThumbLoading] = useState<string | null>(null);
  const [thumbError, setThumbError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generateThumbPrompt(videoId: string) {
    setThumbLoading(videoId);
    setThumbError(null);
    try {
      const res = await fetch(`/api/admin/videos/${videoId}/thumbnail-prompt`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setThumbError(data?.error ?? "Eroare la generare.");
        return;
      }
      setThumbPrompt({ title: data.title, prompt: data.prompt });
    } catch (err) {
      setThumbError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setThumbLoading(null);
    }
  }

  useEffect(() => {
    setViewedIds(readViewed());
  }, []);

  useEffect(() => {
    if (!selectedVideoId) return;
    setViewedIds((prev) => {
      if (prev.has(selectedVideoId)) return prev;
      const next = new Set(prev);
      next.add(selectedVideoId);
      writeViewed(next);
      return next;
    });
  }, [selectedVideoId]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const v of videos) {
      if (v.tags) {
        for (const t of v.tags) tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort();
  }, [videos]);

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeTag && (!v.tags || !v.tags.includes(activeTag))) return false;
      if (showNewOnly && !isNew(v.upload_date)) return false;
      if (showUnwatchedOnly && viewedIds.has(v.id)) return false;
      return true;
    });
  }, [videos, search, activeTag, showNewOnly, showUnwatchedOnly, viewedIds]);

  const hasFilters = search !== "" || activeTag !== null || showNewOnly || showUnwatchedOnly;
  const tierOrder = { free: 1, elite: 2 };
  const canAccess = (required: "free" | "elite") =>
    userTier !== null && tierOrder[userTier] >= tierOrder[required];

  const accessibleVideos = useMemo(
    () => videos.filter((v) => canAccess(v.tier_required)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videos, userTier],
  );
  const watchedAccessible = accessibleVideos.filter((v) => viewedIds.has(v.id)).length;
  const totalAccessible = accessibleVideos.length;
  const progressPct = totalAccessible > 0 ? (watchedAccessible / totalAccessible) * 100 : 0;

  // Selected video (from URL param)
  const selectedVideo = selectedVideoId
    ? videos.find((v) => v.id === selectedVideoId && canAccess(v.tier_required)) ?? null
    : null;

  return (
    <>
      {/* ADMIN: Thumbnail prompt modal */}
      {thumbPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-crypto-dark/80 p-4 backdrop-blur-sm"
          onClick={() => {
            setThumbPrompt(null);
            setCopied(false);
          }}
        >
          <div
            className="glass-card relative w-full max-w-2xl p-5 md:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-400">
                  Admin · Prompt Thumbnail
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">{thumbPrompt.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setThumbPrompt(null);
                  setCopied(false);
                }}
                className="text-slate-500 transition hover:text-slate-200"
                aria-label="Închide"
              >
                ×
              </button>
            </div>
            <textarea
              readOnly
              value={thumbPrompt.prompt}
              className="mt-4 h-72 w-full rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-xs text-slate-300"
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(thumbPrompt.prompt).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="rounded-md border border-accent-emerald/40 bg-accent-emerald/10 px-3 py-1.5 text-xs font-semibold text-accent-emerald transition hover:bg-accent-emerald/20"
              >
                {copied ? "Copiat ✓" : "Copiază"}
              </button>
              <a
                href="https://gemini.google.com/app"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Deschide Gemini ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO PLAYER */}
      {selectedVideo && (
        <section className="glass-card mb-10 overflow-hidden p-4 md:p-6">
          <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-crypto-ink">
            {selectedVideo.r2_url ? (
              <video
                controls
                controlsList="nodownload"
                className="h-full w-full"
                onContextMenu={(e) => e.preventDefault()}
                playsInline
                preload="metadata"
                src={selectedVideo.r2_url}
              >
                Browserul tau nu suporta redarea video.
              </video>
            ) : (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
                referrerPolicy="strict-origin-when-cross-origin"
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtube_id}?rel=0&fs=1`}
                title={selectedVideo.title}
              />
            )}
          </div>
          <div className="mt-3">
            {!selectedVideo.r2_url && (
            <a
              href={`https://www.youtube.com/watch?v=${selectedVideo.youtube_id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300"
            >
              Nu merge? Deschide pe YouTube ↗
            </a>
            )}
          </div>
          <div className="mt-5 space-y-3">
            <h2 className="text-2xl font-bold text-white">{selectedVideo.title}</h2>
            {selectedVideo.summary && <SummaryContent text={selectedVideo.summary} />}
            {isAdmin && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => generateThumbPrompt(selectedVideo.id)}
                  disabled={thumbLoading === selectedVideo.id}
                  className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
                >
                  {thumbLoading === selectedVideo.id ? "Generez..." : "Prompt thumbnail (admin)"}
                </button>
                {thumbError && <span className="text-xs text-red-400">{thumbError}</span>}
              </div>
            )}
            {selectedVideo.tags && selectedVideo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedVideo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-accent-emerald/20 bg-accent-emerald/10 px-3 py-1 text-xs font-medium text-accent-emerald"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {selectedVideo.duration_seconds && selectedVideo.duration_seconds > 0 && (
              <p className="font-data text-sm text-slate-500">
                {formatDuration(selectedVideo.duration_seconds)}
              </p>
            )}
            <Link
              href="/dashboard/videos"
              className="inline-flex items-center gap-2 text-sm text-accent-emerald hover:underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Inapoi la biblioteca
            </Link>
          </div>
        </section>
      )}

      {/* FEATURED LATEST VIDEO */}
      {!selectedVideo && videos.length > 0 && (
        <Link
          href={`/dashboard/videos?video=${videos[0].id}`}
          className="glass-card group mb-8 block overflow-hidden transition-all hover:border-accent-emerald"
        >
          <div className="flex flex-col md:flex-row">
            <div className="relative aspect-video md:w-1/2">
              <VideoTemplateThumbnail
                date={videos[0].upload_date}
                tag={videos[0].category}
                thumbnailUrl={videos[0].thumbnail_url}
                youtubeId={videos[0].youtube_id}
                title={videos[0].title}
              />
              <div className="absolute left-3 top-3 rounded-md bg-accent-emerald px-3 py-1 text-xs font-bold uppercase tracking-wider text-crypto-dark">
                Ultimul Video
              </div>
            </div>
            <div className="flex flex-col justify-center p-5 md:w-1/2 md:p-8">
              <h2 className="text-xl font-bold text-white md:text-2xl">{videos[0].title}</h2>
              {videos[0].summary && (
                <p className="mt-3 line-clamp-3 text-sm text-slate-400">{summaryFirstLine(videos[0].summary)}</p>
              )}
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 rounded-xl bg-accent-emerald/10 px-4 py-2 text-sm font-semibold text-accent-emerald group-hover:bg-accent-emerald/20">
                  Vizionează acum →
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* WATCH PROGRESS */}
      {totalAccessible > 0 && (
        <section className="glass-card mb-6 p-4 md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Progres bibliotecă</p>
              <p className="mt-1 font-data text-base font-bold text-white tabular-nums">
                {watchedAccessible} / {totalAccessible} <span className="text-xs font-normal text-slate-400">vizionate</span>
              </p>
            </div>
            <span className="font-data text-xl font-bold tabular-nums text-accent-emerald">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-accent-emerald transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>
      )}

      {/* SEARCH + FILTER BAR */}
      <section className="glass-card mb-8 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              aria-label="Cauta video dupa titlu"
              type="text"
              placeholder="Cauta video..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent-emerald/50 focus:ring-1 focus:ring-accent-emerald/30"
            />
          </div>

          {/* NOU toggle */}
          <button
            aria-label="Filtreaza doar video-urile noi"
            aria-pressed={showNewOnly}
            onClick={() => setShowNewOnly(!showNewOnly)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              showNewOnly
                ? "border-accent-emerald bg-accent-emerald/20 text-accent-emerald"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            NOU
          </button>

          {/* Nevizionate toggle */}
          <button
            aria-label="Arata doar video-urile nevizionate"
            aria-pressed={showUnwatchedOnly}
            onClick={() => setShowUnwatchedOnly(!showUnwatchedOnly)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              showUnwatchedOnly
                ? "border-accent-emerald bg-accent-emerald/20 text-accent-emerald"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            Nevizionate
          </button>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setActiveTag(null);
                setShowNewOnly(false);
                setShowUnwatchedOnly(false);
              }}
              className="text-sm text-slate-500 hover:text-white transition"
            >
              Reseteaza filtre
            </button>
          )}
        </div>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeTag === tag
                    ? "border border-accent-emerald bg-accent-emerald/20 text-accent-emerald"
                    : "border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* GRID - R2 videos (main) + YouTube videos (collapsed) */}
      {(() => {
        const r2Videos = filtered.filter(v => v.r2_url);
        const ytVideos = filtered.filter(v => !v.r2_url);
        return (
          <>
          {r2Videos.length > 0 && (
            <div className="mb-8 grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {r2Videos.map((video) => {
                const locked = !canAccess(video.tier_required);
                const isSelected = video.id === selectedVideoId;
                const videoIsNew = isNew(video.upload_date);
                const watched = viewedIds.has(video.id);
                return locked ? (
                  <div key={video.id} className="glass-card overflow-hidden opacity-60">
                    <div className="relative overflow-hidden">
                      <VideoTemplateThumbnail className="opacity-40" date={video.upload_date} tag={video.category} thumbnailUrl={video.thumbnail_url} youtubeId={video.youtube_id} title={video.title} />
                      <div className="absolute inset-0 flex items-center justify-center bg-crypto-ink/60">
                        <div className="text-center">
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-emerald">Elite</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5"><h3 className="line-clamp-2 text-lg font-bold text-white">{video.title}</h3></div>
                  </div>
                ) : (
                  <Link key={video.id} href={`/dashboard/videos?video=${video.id}`} className={`glass-card group overflow-hidden transition-all ${isSelected ? "border-accent-emerald shadow-glow" : ""} ${watched ? "opacity-75" : ""}`}>
                    <div className="relative overflow-hidden">
                      <VideoTemplateThumbnail date={video.upload_date} tag={video.category} thumbnailUrl={video.thumbnail_url} youtubeId={video.youtube_id} title={video.title} />
                      {videoIsNew && !watched && <div className="absolute right-3 top-3 rounded-md bg-accent-emerald px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-crypto-dark">NOU</div>}
                      {watched && (
                        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-crypto-ink/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 backdrop-blur-sm">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                          Vizionat
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="line-clamp-2 text-lg font-bold text-white">{video.title}</h3>
                      {video.summary && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{summaryFirstLine(video.summary)}</p>}
                      {video.tags && video.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">{video.tags.map(tag => <span key={tag} className="rounded-full border border-accent-emerald/20 bg-accent-emerald/10 px-2.5 py-0.5 text-xs text-accent-emerald">{tag}</span>)}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* YouTube videos - collapsed */}
          {ytVideos.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowOldVideos(!showOldVideos)}
                className="mb-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-left transition hover:bg-white/10"
              >
                <span className="text-sm font-semibold text-slate-300">Video-uri mai vechi ({ytVideos.length})</span>
                <svg className={`h-5 w-5 text-slate-500 transition-transform ${showOldVideos ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {showOldVideos && (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {ytVideos.map((video) => {
                    const locked = !canAccess(video.tier_required);
            const isSelected = video.id === selectedVideoId;
            const videoIsNew = isNew(video.upload_date);
            const watched = viewedIds.has(video.id);

            if (locked) {
              return (
                <article
                  key={video.id}
                  className="glass-card overflow-hidden opacity-90"
                >
                  <div className="relative overflow-hidden">
                    <VideoTemplateThumbnail
                      className="opacity-40"
                      date={video.upload_date}
                      tag={video.category}
                      thumbnailUrl={video.thumbnail_url}
                      title={video.title}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-crypto-ink/60">
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-emerald">
                          Elite
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 text-lg font-bold text-white">{video.title}</h3>
                    {video.summary && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{summaryFirstLine(video.summary)}</p>
                    )}
                    <div className="mt-4">
                      <Link className="ghost-button text-sm" href="/upgrade">
                        Upgrade la Elite
                      </Link>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <Link
                key={video.id}
                href={`/dashboard/videos?video=${video.id}`}
                className={`glass-card group overflow-hidden transition-all ${
                  isSelected ? "border-accent-emerald shadow-glow" : ""
                } ${watched ? "opacity-75" : ""}`}
              >
                <div className="relative overflow-hidden">
                  <VideoTemplateThumbnail
                    date={video.upload_date}
                    tag={video.category}
                    thumbnailUrl={video.thumbnail_url}
                    youtubeId={video.youtube_id}
                    title={video.title}
                  />
                  {/* NOU badge */}
                  {videoIsNew && !watched && (
                    <div className="absolute right-3 top-3 rounded-md bg-accent-emerald px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-crypto-dark">
                      NOU
                    </div>
                  )}
                  {watched && (
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-crypto-ink/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 backdrop-blur-sm">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                      Vizionat
                    </div>
                  )}
                  {/* Duration overlay */}
                  {video.duration_seconds && video.duration_seconds > 0 && (
                    <div className="absolute bottom-3 right-3 rounded-md bg-crypto-ink/80 px-2 py-0.5 font-data text-xs text-white/80 backdrop-blur-sm">
                      {formatDuration(video.duration_seconds)}
                    </div>
                  )}
                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-crypto-ink/0 opacity-0 transition-all group-hover:bg-crypto-ink/30 group-hover:opacity-100">
                    <div className="rounded-full bg-accent-emerald/90 p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-crypto-dark"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-2 text-base font-bold text-white group-hover:text-accent-emerald transition-colors">
                    {video.title}
                  </h3>
                  {video.summary && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">{summaryFirstLine(video.summary)}</p>
                  )}
                  {video.tags && video.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {video.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-accent-emerald/15 bg-accent-emerald/5 px-2 py-0.5 text-[11px] font-medium text-accent-emerald/80"
                        >
                          {tag}
                        </span>
                      ))}
                      {video.tags.length > 3 && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-500">
                          +{video.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {isSelected && (
                    <p className="mt-3 text-xs font-semibold text-accent-emerald">Se reda acum</p>
                  )}
                </div>
              </Link>
            );
          })}
                </div>
              )}
            </div>
          )}

          {r2Videos.length === 0 && ytVideos.length === 0 && (
            <div className="glass-card p-10 text-center">
              <p className="text-lg font-semibold text-white">Niciun rezultat găsit</p>
              <p className="mt-2 text-sm text-slate-400">
                Încearcă alte cuvinte cheie sau resetează filtrele.
              </p>
            </div>
          )}
          </>
        );
      })()}
    </>
  );
}

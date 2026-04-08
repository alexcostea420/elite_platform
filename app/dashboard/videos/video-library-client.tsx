"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { VideoTemplateThumbnail } from "@/components/ui/video-thumbnail";

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
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function isNew(uploadDate: string): boolean {
  const diff = Date.now() - new Date(uploadDate).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

export function VideoLibraryClient({
  videos,
  selectedVideoId,
  userTier,
}: {
  videos: VideoRow[];
  selectedVideoId: string | null;
  userTier: "free" | "elite" | null;
}) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showNewOnly, setShowNewOnly] = useState(false);

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
      return true;
    });
  }, [videos, search, activeTag, showNewOnly]);

  const hasFilters = search !== "" || activeTag !== null || showNewOnly;
  const tierOrder = { free: 1, elite: 2 };
  const canAccess = (required: "free" | "elite") =>
    userTier !== null && tierOrder[userTier] >= tierOrder[required];

  // Selected video (from URL param)
  const selectedVideo = selectedVideoId
    ? videos.find((v) => v.id === selectedVideoId && canAccess(v.tier_required)) ?? null
    : null;

  return (
    <>
      {/* VIDEO PLAYER */}
      {selectedVideo && (
        <section className="glass-card mb-10 overflow-hidden p-4 md:p-6">
          <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-crypto-ink">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
              referrerPolicy="strict-origin-when-cross-origin"
              src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtube_id}?modestbranding=1&rel=0&showinfo=0`}
              title={selectedVideo.title}
            />
          </div>
          <div className="mt-5 space-y-3">
            <h2 className="text-2xl font-bold text-white">{selectedVideo.title}</h2>
            {selectedVideo.summary && (
              <div className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-400">{selectedVideo.summary}</div>
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

      {/* SEARCH + FILTER BAR */}
      <section className="glass-card mb-8 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg
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
              type="text"
              placeholder="Cauta video..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent-emerald/50 focus:ring-1 focus:ring-accent-emerald/30"
            />
          </div>

          {/* NOU toggle */}
          <button
            onClick={() => setShowNewOnly(!showNewOnly)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              showNewOnly
                ? "border-accent-emerald bg-accent-emerald/20 text-accent-emerald"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            NOU
          </button>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setActiveTag(null);
                setShowNewOnly(false);
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

      {/* GRID */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((video) => {
            const locked = !canAccess(video.tier_required);
            const isSelected = video.id === selectedVideoId;
            const videoIsNew = isNew(video.upload_date);

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
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{video.summary?.split('\n')[0]}</p>
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
                }`}
              >
                <div className="relative overflow-hidden">
                  <VideoTemplateThumbnail
                    date={video.upload_date}
                    tag={video.category}
                    thumbnailUrl={video.thumbnail_url}
                  />
                  {/* NOU badge */}
                  {videoIsNew && (
                    <div className="absolute right-3 top-3 rounded-md bg-accent-emerald px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-crypto-dark">
                      NOU
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
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">{video.summary?.split('\n')[0]}</p>
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
      ) : (
        <div className="glass-card p-10 text-center">
          <p className="text-lg font-semibold text-white">Niciun rezultat gasit</p>
          <p className="mt-2 text-sm text-slate-400">
            Incearca alte cuvinte cheie sau reseteaza filtrele.
          </p>
        </div>
      )}
    </>
  );
}

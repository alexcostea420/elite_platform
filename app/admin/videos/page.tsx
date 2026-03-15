import Link from "next/link";
import { redirect } from "next/navigation";

import { createVideoAction, deleteVideoAction, updateVideoAction } from "@/app/admin/videos/actions";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

type AdminVideosPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
    q?: string;
    tier?: string;
    status?: string;
    sort?: string;
    confirmDelete?: string;
  };
};

type VideoRow = {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  category: string;
  tier_required: "free" | "elite";
  duration_seconds: number | null;
  thumbnail_url: string | null;
  is_published: boolean;
};

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function matchesSearch(video: VideoRow, query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  return [
    video.title,
    video.category,
    video.youtube_id,
    video.description ?? "",
  ].some((value) => normalizeSearchValue(value).includes(normalizedQuery));
}

export default async function AdminVideosPage({ searchParams }: AdminVideosPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/videos");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  const { data: videos } = await supabase
    .from("videos")
    .select("id, youtube_id, title, description, category, tier_required, duration_seconds, thumbnail_url, is_published")
    .order("upload_date", { ascending: false });

  const searchQuery = searchParams?.q?.trim() ?? "";
  const tierFilter = searchParams?.tier === "elite" || searchParams?.tier === "free" ? searchParams.tier : "all";
  const statusFilter =
    searchParams?.status === "published" || searchParams?.status === "draft"
      ? searchParams.status
      : "all";
  const sortFilter =
    searchParams?.sort === "title_asc" || searchParams?.sort === "title_desc"
      ? searchParams.sort
      : "latest";
  const confirmDeleteId = searchParams?.confirmDelete?.trim() ?? "";

  const allVideos: VideoRow[] = videos ?? [];
  const filteredVideos = allVideos
    .filter((video) => {
      const tierMatches = tierFilter === "all" ? true : video.tier_required === tierFilter;
      const statusMatches =
        statusFilter === "all"
          ? true
          : statusFilter === "published"
            ? video.is_published
            : !video.is_published;

      return tierMatches && statusMatches && matchesSearch(video, searchQuery);
    })
    .sort((left, right) => {
      if (sortFilter === "title_asc") {
        return left.title.localeCompare(right.title, "ro");
      }

      if (sortFilter === "title_desc") {
        return right.title.localeCompare(left.title, "ro");
      }

      return 0;
    });

  const publishedCount = allVideos.filter((video) => video.is_published).length;
  const eliteCount = allVideos.filter((video) => video.tier_required === "elite").length;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <section className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Admin Video</p>
            <h1 className="text-4xl font-bold text-white">Administrare bibliotecă video</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Gestionează conținutul publicat fără write-uri directe din browser. Toate modificările trec prin acțiuni server-side.
            </p>
          </section>

          {searchParams?.message ? (
            <div className="mb-6 rounded-2xl border border-crypto-green/30 bg-crypto-green/10 px-5 py-4 text-sm text-slate-100">
              {searchParams.message}
            </div>
          ) : null}

          {searchParams?.error ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              {searchParams.error}
            </div>
          ) : null}

          <section className="panel mb-10 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white">Adaugă video nou</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Completează întâi câmpurile esențiale, apoi publică doar când thumbnail-ul, titlul și nivelul de acces sunt corecte.
            </p>
            <form action={createVideoAction} className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Identitate video</p>
              </div>
              <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" name="title" placeholder="Titlu video" required />
              <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" name="youtube_id" placeholder="YouTube ID" required />
              <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" name="category" placeholder="Categorie" required />
              <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" name="duration_seconds" placeholder="Durată în secunde" type="number" min="0" />
              <div className="md:col-span-2">
                <p className="mb-2 mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Descriere și vizual</p>
              </div>
              <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white md:col-span-2" name="thumbnail_url" placeholder="Thumbnail URL" />
              <textarea className="min-h-32 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white md:col-span-2" name="description" placeholder="Descriere" />
              <div className="md:col-span-2">
                <p className="mb-2 mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Acces și publicare</p>
              </div>
              <select className="rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white" defaultValue="free" name="tier_required">
                <option value="free">Free</option>
                <option value="elite">Elite</option>
              </select>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
                <input className="h-4 w-4" defaultChecked name="is_published" type="checkbox" />
                Publicat
              </label>
              <div className="md:col-span-2">
                <button className="accent-button" type="submit">Adaugă video</button>
              </div>
            </form>
          </section>

          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <article className="panel px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Total video-uri</p>
                <h3 className="mt-3 text-2xl font-bold text-white">{allVideos.length}</h3>
                <p className="mt-2 text-sm text-slate-400">materiale disponibile în admin</p>
              </article>
              <article className="panel px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Publicate</p>
                <h3 className="mt-3 text-2xl font-bold text-white">{publishedCount}</h3>
                <p className="mt-2 text-sm text-slate-400">gata pentru biblioteca membrilor</p>
              </article>
              <article className="panel px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Conținut Elite</p>
                <h3 className="mt-3 text-2xl font-bold text-white">{eliteCount}</h3>
                <p className="mt-2 text-sm text-slate-400">materiale premium în catalog</p>
              </article>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Video-uri existente</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {filteredVideos.length} rezultate afișate din {allVideos.length} video-uri
                </p>
              </div>
              <form className="grid gap-3 sm:grid-cols-3" method="get">
                <input
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                  defaultValue={searchQuery}
                  name="q"
                  placeholder="Caută după titlu, categorie sau YouTube ID"
                />
                <select
                  className="rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white"
                  defaultValue={tierFilter}
                  name="tier"
                >
                  <option value="all">Toate nivelurile</option>
                  <option value="free">Free</option>
                  <option value="elite">Elite</option>
                </select>
                <select
                  className="rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white"
                  defaultValue={statusFilter}
                  name="status"
                >
                  <option value="all">Toate stările</option>
                  <option value="published">Publicate</option>
                  <option value="draft">Draft</option>
                </select>
                <select
                  className="rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white sm:col-span-3"
                  defaultValue={sortFilter}
                  name="sort"
                >
                  <option value="latest">Cele mai recente întâi</option>
                  <option value="title_asc">Titlu A-Z</option>
                  <option value="title_desc">Titlu Z-A</option>
                </select>
                <div className="sm:col-span-3 flex flex-wrap gap-3">
                  <button className="accent-button" type="submit">Aplică filtrele</button>
                  <Link className="ghost-button" href="/admin/videos">Resetează</Link>
                </div>
              </form>
            </div>

            {filteredVideos.map((video) => (
              <article key={video.id} className="panel p-6 md:p-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em]">
                    <span className={`rounded-full px-3 py-1 ${video.tier_required === "elite" ? "bg-accent-emerald/10 text-accent-emerald" : "bg-white/5 text-slate-300"}`}>
                      {video.tier_required}
                    </span>
                    <span className={`rounded-full px-3 py-1 ${video.is_published ? "bg-crypto-green/10 text-crypto-green" : "bg-amber-500/10 text-amber-300"}`}>
                      {video.is_published ? "Publicat" : "Draft"}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">ID video: {video.id}</span>
                </div>
                <div className="mb-5 grid gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Titlu curent</p>
                    <p className="mt-2 font-semibold text-white">{video.title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Categorie</p>
                    <p className="mt-2 font-semibold text-white">{video.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Durată</p>
                    <p className="mt-2 font-semibold text-white">{video.duration_seconds ?? "Nesetată"} sec</p>
                  </div>
                </div>
                <form action={updateVideoAction} className="grid gap-4 md:grid-cols-2">
                  <input name="id" type="hidden" value={video.id} />
                  <div className="md:col-span-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Editează conținutul</p>
                  </div>
                  <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" defaultValue={video.title} name="title" required />
                  <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" defaultValue={video.youtube_id} name="youtube_id" required />
                  <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" defaultValue={video.category} name="category" required />
                  <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" defaultValue={video.duration_seconds ?? ""} min="0" name="duration_seconds" type="number" />
                  <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white md:col-span-2" defaultValue={video.thumbnail_url ?? ""} name="thumbnail_url" />
                  <textarea className="min-h-28 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white md:col-span-2" defaultValue={video.description ?? ""} name="description" />
                  <select className="rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white" defaultValue={video.tier_required} name="tier_required">
                    <option value="free">Free</option>
                    <option value="elite">Elite</option>
                  </select>
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
                    <input className="h-4 w-4" defaultChecked={video.is_published} name="is_published" type="checkbox" />
                    Publicat
                  </label>
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-sm text-slate-400">
                      {video.thumbnail_url ? "Thumbnail personalizat configurat" : "Se va folosi thumbnail-ul YouTube implicit"}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button className="accent-button" type="submit">Salvează modificările</button>
                      {confirmDeleteId === video.id ? (
                        <>
                          <button
                            className="inline-flex items-center justify-center rounded-xl border border-red-500/40 px-6 py-3 font-semibold text-red-200 hover:bg-red-500/10"
                            formAction={deleteVideoAction}
                            type="submit"
                          >
                            Confirmă ștergerea
                          </button>
                          <Link className="ghost-button" href="/admin/videos">
                            Anulează
                          </Link>
                        </>
                      ) : (
                        <Link
                          className="inline-flex items-center justify-center rounded-xl border border-red-500/40 px-6 py-3 font-semibold text-red-200 hover:bg-red-500/10"
                          href={`/admin/videos?confirmDelete=${video.id}`}
                        >
                          Șterge
                        </Link>
                      )}
                    </div>
                  </div>
                  {confirmDeleteId === video.id ? (
                    <div className="md:col-span-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-100">
                      Confirmă ștergerea doar dacă vrei să elimini definitiv acest video din bibliotecă.
                    </div>
                  ) : null}
                </form>
              </article>
            ))}

            {filteredVideos.length === 0 ? (
              <section className="panel p-8 text-center">
                <div className="text-5xl">🔎</div>
                <h3 className="mt-4 text-2xl font-bold text-white">Nu există rezultate pentru filtrele curente</h3>
                <p className="mt-3 text-slate-400">
                  Ajustează căutarea sau resetează filtrele pentru a vedea toate video-urile.
                </p>
              </section>
            ) : null}
          </section>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

const libraryVideos = [
  {
    id: "1",
    title: "Live Trading #1 - Analiza BTC + Setup-uri",
    date: "25 Mar 2026",
    youtubeId: "dQw4w9WgXcQ",
  },
  {
    id: "2",
    title: "Cum folosesc indicatorii Elite",
    date: "18 Mar 2026",
    youtubeId: "dQw4w9WgXcQ",
  },
  {
    id: "3",
    title: "Managementul riscului - Reguli de aur",
    date: "10 Mar 2026",
    youtubeId: "dQw4w9WgXcQ",
  },
  {
    id: "4",
    title: "Market Structure + Order Flow explicat",
    date: "2 Mar 2026",
    youtubeId: "dQw4w9WgXcQ",
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "Biblioteca Video Elite | Sesiuni Live Trading Crypto",
  description:
    "Acceseaza biblioteca video completa cu sesiuni live de trading, analize BTC si educatie crypto pentru membrii Elite.",
  keywords: [
    "biblioteca video trading",
    "sesiuni live crypto",
    "educatie trading crypto",
    "video trading romania",
  ],
  path: "/dashboard/library",
  host: "app",
  index: false,
});

export default async function LibraryPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/library");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isElite =
    profile?.subscription_tier === "elite" &&
    profile?.subscription_status === "active";

  return (
    <>
      <Navbar
        mode="dashboard"
        userIdentity={{
          displayName: identity.displayName,
          initials: identity.initials,
        }}
      />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <section className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Biblioteca Video
            </p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Sesiuni live si materiale educationale
            </h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Toate sesiunile live, analizele si materialele educationale intr-un singur loc.
            </p>
          </section>

          {isElite ? (
            <div className="grid gap-8 md:grid-cols-2">
              {libraryVideos.map((video) => (
                <article key={video.id} className="panel overflow-hidden p-0">
                  <div className="relative aspect-video">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${video.youtubeId}`}
                      title={video.title}
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {video.date}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-white">
                      {video.title}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-8 md:grid-cols-2">
                {libraryVideos.map((video) => (
                  <article key={video.id} className="panel overflow-hidden p-0">
                    <div className="relative aspect-video bg-crypto-ink">
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800/80 to-crypto-ink/90 backdrop-blur-sm">
                        <div className="text-center">
                          <span className="text-4xl">🔒</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {video.date}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-white">
                        {video.title}
                      </h3>
                    </div>
                  </article>
                ))}
              </div>

              <section className="mt-10 rounded-2xl border border-accent-emerald/30 bg-accent-emerald/5 p-8 text-center">
                <h2 className="text-2xl font-bold text-white">
                  Devino membru Elite pentru acces complet
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-slate-400">
                  Membrii Elite au acces nelimitat la toate sesiunile live, analizele video si materialele educationale.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link className="accent-button px-6 py-3 font-bold" href="/upgrade">
                    Upgrade la Elite
                  </Link>
                  <Link className="ghost-button px-6 py-3" href="/dashboard">
                    Inapoi in dashboard
                  </Link>
                </div>
              </section>
            </>
          )}
        </Container>
      </main>
      <Footer compact />
    </>
  );
}

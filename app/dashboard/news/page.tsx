import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ELITE_PROFILE_COLUMNS, hasEliteAccess } from "@/lib/auth/elite-gate";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NewsClient } from "./news-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Știri Crypto Live | Armata de Traderi",
  description: "Feed live cu știri crypto agregate din cele mai importante surse: CoinDesk, CoinTelegraph, Decrypt, Bitcoin Magazine.",
  keywords: ["stiri crypto", "news feed crypto", "coindesk", "cointelegraph"],
  path: "/dashboard/news",
  host: "app",
});

export default async function NewsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/news");

  const { data: profile } = await supabase
    .from("profiles")
    .select(ELITE_PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) redirect("/upgrade");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="section-label mb-2">Feed Live</p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Știri Crypto</h1>
        <p className="mt-2 text-sm text-slate-500">Agregate automat din cele mai importante surse. Actualizare la fiecare 5 minute.</p>
      </div>
      <NewsClient />
    </div>
  );
}

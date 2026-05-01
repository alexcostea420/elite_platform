import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { JournalClient } from "./journal-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Jurnal Trading + Calculator Sizing | Armata de Traderi",
  description:
    "Jurnal trading personal cu calculator de position sizing integrat: salvează tranzacțiile, calculează win rate, profit factor, expectancy și R-multiple.",
  keywords: [
    "jurnal trading",
    "trading journal",
    "calculator position sizing",
    "win rate",
    "profit factor",
    "R-multiple",
  ],
  path: "/tools/journal",
  host: "app",
  index: true,
});

export const revalidate = 0;

export default async function JournalPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let identity: ReturnType<typeof getDisplayIdentity> | null = null;
  let isAuthed = false;
  if (user) {
    isAuthed = true;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  }

  return (
    <>
      <Navbar mode={isAuthed ? "dashboard" : "marketing"} userIdentity={identity ?? undefined} />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="mb-8">
          <p className="section-label mb-2">Tool gratuit</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Jurnal Trading + Calculator Sizing
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Calculator de position sizing integrat: calculezi mărimea, salvezi direct în jurnal,
            vezi statistici reale (win rate, profit factor, expectancy) și calendar P&amp;L.
            Datele rămân pe device, privacy-first.
          </p>
        </div>
        <JournalClient />
      </main>
      <Footer compact />
    </>
  );
}

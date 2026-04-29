import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { CalculatorClient } from "./calculator-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Calculator Position Sizing | Armata de Traderi",
  description:
    "Calculează exact câți bani să riști pe fiecare trade. Regula 1-2% aplicată automat: cont, entry, stop-loss → poziție și sumă riscată.",
  keywords: ["calculator position sizing", "risk management trading", "regula 1%", "money management crypto"],
  path: "/tools/calculator",
  host: "app",
  index: true,
});

export const revalidate = 0;

export default async function CalculatorPage() {
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
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="mb-8">
          <p className="section-label mb-2">Tool gratuit</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Calculator Position Sizing</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Cea mai importantă decizie pe orice trade nu e <em>unde</em> intri, ci <em>cât</em> riști. Pune cifre reale și află exact mărimea poziției.
          </p>
        </div>
        <CalculatorClient isAuthed={isAuthed} />
      </main>
      <Footer compact />
    </>
  );
}

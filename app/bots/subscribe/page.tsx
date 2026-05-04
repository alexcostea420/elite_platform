import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MexcConnectForm } from "@/components/bots/mexc-connect-form";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Abonare Bot Trading | Conectează MEXC",
  description:
    "Conectează-ți contul MEXC și activează botul de trading automat.",
  keywords: ["abonare bot trading", "copytrade", "MEXC bot"],
  path: "/bots/subscribe",
  host: "app",
  index: false,
});

export default async function BotSubscribePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/bots/subscribe");
  }

  // Only allow users with existing bot subscription to access this page
  // Everyone else sees Coming Soon
  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("role, bot_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminCheck?.bot_active && adminCheck?.role !== "admin") {
    const identity = getDisplayIdentity(null, user.email);
    return (
      <>
        <Navbar mode="dashboard" userIdentity={{ displayName: identity.displayName, initials: identity.initials }} />
        <main className="pb-16 pt-24 md:pt-28">
          <ComingSoon
            icon="🤖"
            title="Bot Trading · Coming Soon"
            description="Botul de copytrade este în dezvoltare. Vei primi o notificare când va fi disponibil."
          />
        </main>
        <Footer compact />
      </>
    );
  }

  const [{ data: profile }, { data: activeSub }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, subscription_tier")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("bot_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (activeSub) {
    redirect("/bots/dashboard");
  }

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isElite = profile?.subscription_tier === "elite";

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
          <div className="mx-auto max-w-2xl">
            <SectionHeading
              eyebrow="Pasul 1"
              title="Conectează contul MEXC"
              description="Introdu cheile API pentru a activa copytrade-ul automat pe contul tău."
            />
          </div>
          <div className="mt-10">
            <MexcConnectForm isElite={isElite} />
          </div>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}

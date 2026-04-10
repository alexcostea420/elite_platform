import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { BotAdminClient } from "./bot-admin-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Bot Admin | Manage Subscribers",
  description: "Admin panel for managing bot trading subscribers.",
  keywords: ["bot admin", "copytrade admin"],
  path: "/bots/admin",
  host: "app",
  index: false,
});

export default async function BotAdminPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  // Get all bot subscribers with their data
  const { data: subs } = await supabase
    .from("bot_subscriptions")
    .select("*, profiles(full_name, discord_username, bot_active)")
    .order("created_at", { ascending: false });

  const { data: wallets } = await supabase
    .from("bot_wallets")
    .select("user_id, exchange, max_risk_pct, paused, is_verified");

  const subscribers = (subs ?? []).map((sub: Record<string, unknown>) => {
    const w = (wallets ?? []).find((w: Record<string, unknown>) => w.user_id === sub.user_id);
    const p = sub.profiles as Record<string, unknown> | null;
    const now = new Date();
    const expiresAt = sub.expires_at ? new Date(String(sub.expires_at)) : null;
    const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const isExpired = expiresAt ? expiresAt < now : true;

    return {
      id: String(sub.id),
      user_id: String(sub.user_id),
      name: String(p?.discord_username ?? p?.full_name ?? "?"),
      exchange: String(w?.exchange ?? "-"),
      risk: Number(w?.max_risk_pct ?? 0),
      paused: Boolean(w?.paused),
      verified: Boolean(w?.is_verified),
      bot_active: Boolean(p?.bot_active),
      plan: String(sub.plan ?? "-"),
      status: String(sub.status ?? "-"),
      daysLeft,
      isExpired,
      expiresAt: expiresAt?.toLocaleDateString("ro-RO") ?? "-",
    };
  });

  return (
    <>
      <Navbar mode="dashboard" isAdmin={true} userIdentity={{ displayName: identity.displayName, initials: identity.initials }} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Bot Admin</h1>
            <p className="mt-2 text-slate-400">{subscribers.length} subscribers</p>
          </div>

          <BotAdminClient subscribers={subscribers} />
        </Container>
      </main>
      <Footer compact />
    </>
  );
}

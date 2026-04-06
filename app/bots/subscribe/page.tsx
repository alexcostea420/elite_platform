import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WalletConnectForm } from "@/components/bots/wallet-connect-form";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Abonare Bot Trading | Conectează Wallet",
  description: "Conectează-ți wallet-ul Hyperliquid și activează botul de trading automat.",
  keywords: ["abonare bot trading", "copytrade", "hyperliquid bot"],
  path: "/bots/subscribe",
  host: "app",
  index: false,
});

export default async function BotSubscribePage() {
  // Bot is Coming Soon
  redirect("/bots");
}

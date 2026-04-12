import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Alex's Brain | Asistent AI Trading",
  description: "Asistentul tau AI de trading antrenat pe metodologia lui Alex. Analiza chart-uri, validare trade-uri, quiz-uri practice.",
  keywords: ["alex brain", "asistent ai trading", "analiza chart", "validare trade"],
  path: "/dashboard/ask-alex",
  host: "app",
  index: false,
});

// Gallery images data
const gallery = [
  { src: "/alexs-brain/ab5-cvx-trade-analysis.jpg", alt: "CVX trade analysis - PRO/CONTRA complet" },
  { src: "/alexs-brain/ab8-eth-pdh-strategy.jpg", alt: "ETH PDH strategy - setup complet" },
  { src: "/alexs-brain/ab3-hype-long-or-short.jpg", alt: "HYPE 4H - Long or Short analiza" },
  { src: "/alexs-brain/ab4-eth-trade-management.jpg", alt: "ETH trade management - 3 optiuni exit" },
  { src: "/alexs-brain/ab6-eth-breakout-structura.jpg", alt: "ETH breakout - structura si niveluri" },
  { src: "/alexs-brain/ab2-quiz-suporti-rezistente.jpg", alt: "Quiz suporti si rezistente" },
  { src: "/alexs-brain/ab7-video-links-rsi-fibonacci.jpg", alt: "Video links - RSI, Fibonacci, Elliott Wave" },
  { src: "/alexs-brain/ab1-intro-salut.jpg", alt: "Intro - Ce poate face Alex Brain" },
];

export default async function AskAlexPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/ask-alex");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_tier !== "elite") redirect("/upgrade");
  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-3">
            <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/dashboard">Dashboard</Link>
            <span className="text-slate-700">/</span>
            <p className="text-sm font-semibold text-accent-emerald">Alex&apos;s Brain</p>
          </div>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">Alex&apos;s Brain</h1>
              <span className="rounded-full bg-accent-emerald/15 border border-accent-emerald/30 px-3 py-1 text-xs font-semibold text-accent-emerald">Disponibil pe Discord</span>
            </div>
            <p className="max-w-2xl text-slate-400">
              Asistentul tau AI de trading. Antrenat pe metodologia lui Alex, 55+ video-uri, si ani de analize.
            </p>
          </div>

          {/* 3 capability cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-10">
            {[
              { title: "Analizeaza chart-uri", text: "Pune o poza cu chart-ul tau si primesti analiza completa: structura, niveluri cheie, S/R, pattern-uri.", img: "/alexs-brain/ab6-eth-breakout-structura.jpg" },
              { title: "Valideaza trade-uri", text: "Spune-i entry, SL, si TP. Primesti PRO/CONTRA, risk/reward, si strategie recomandata.", img: "/alexs-brain/ab5-cvx-trade-analysis.jpg" },
              { title: "Quiz-uri practice", text: "Cere un quiz dupa orice video si testeaza ce ai invatat.", img: "/alexs-brain/ab2-quiz-suporti-rezistente.jpg" },
            ].map((card) => (
              <div key={card.title} className="glass-card overflow-hidden">
                <div className="p-5">
                  <h3 className="text-base font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-xs text-slate-400">{card.text}</p>
                </div>
                <Image alt={card.title} className="w-full border-t border-white/5" height={300} src={card.img} width={500} loading="lazy" />
              </div>
            ))}
          </div>

          {/* Full gallery */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-white mb-5">Exemple reale din comunitate</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {gallery.map((img) => (
                <div key={img.src} className="glass-card overflow-hidden p-0">
                  <Image alt={img.alt} className="w-full" height={400} src={img.src} width={600} loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="glass-card p-6 md:p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-3">Incearca acum pe Discord</h2>
            <p className="text-sm text-slate-400 mb-6 max-w-lg mx-auto">
              Deschide canalul #alex-brain si scrie &apos;@Alex&apos;s Brain&apos; urmat de intrebarea ta. Raspunde in secunde.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center mb-6">
              {["Deschide #alex-brain pe Discord", "Scrie @Alex's Brain + intrebarea ta", "Primesti raspuns instant"].map((step, i) => (
                <div key={step} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-emerald/15 text-accent-emerald font-bold text-[10px]">{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
            <a className="accent-button" href="https://discord.gg/ecNNcV5GD9" rel="noreferrer" target="_blank">
              Deschide Discord
            </a>
            <p className="mt-4 text-[10px] text-slate-600">
              Alex&apos;s Brain este un asistent AI. Nu da sfaturi financiare. Foloseste-l ca pe un coleg de trading care stie metodologia pe de rost.
            </p>
          </div>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}

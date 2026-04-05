import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog - Armata de Traderi",
  description:
    "Articole despre trading crypto, educatie financiara si strategii de investitii. Ghiduri pentru incepatori si traderi avansati.",
  keywords: [
    "blog trading crypto",
    "educatie trading romania",
    "ghid trading crypto",
    "cum sa incepi trading",
  ],
  path: "/blog",
});

const articles = [
  {
    slug: "cum-sa-incepi-trading",
    title: "Cum să Începi în Trading Crypto — Ghid Complet pentru Începători",
    excerpt:
      "Totul de la educație, cont demo, strategie, risk management și comunitate. Ghidul complet pentru cei care vor să facă primii pași în trading crypto.",
    date: "2 Aprilie 2026",
    readTime: "8 min",
    category: "Educație",
  },
];

export default function BlogPage() {
  return (
    <>
      <Navbar mode="marketing" />
      <main className="min-h-screen pt-28 pb-20">
        <Container>
          <SectionHeading
            eyebrow="Articole & Ghiduri"
            title={
              <>
                Blog — <span className="gradient-text">Armata de Traderi</span>
              </>
            }
            description="Educație, strategii și insight-uri din lumea trading-ului crypto."
          />

          <div className="mx-auto mt-12 grid max-w-4xl gap-8">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group rounded-2xl border border-white/10 bg-surface-graphite p-6 transition-all hover:border-accent-emerald/30 hover:shadow-glow md:p-8"
              >
                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full border border-accent-emerald/20 bg-accent-emerald/10 px-3 py-1 text-xs font-semibold text-accent-emerald">
                    {article.category}
                  </span>
                  <span className="text-slate-500">{article.date}</span>
                  <span className="text-slate-500">{article.readTime} citire</span>
                </div>
                <h2 className="text-2xl font-bold text-white transition-colors group-hover:text-accent-emerald md:text-3xl">
                  {article.title}
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-slate-400">
                  {article.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-emerald">
                  Citește articolul &rarr;
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

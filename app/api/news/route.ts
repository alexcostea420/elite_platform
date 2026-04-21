import { NextResponse } from "next/server";

export const revalidate = 300; // Cache 5 minutes

type NewsItem = {
  title: string;
  url: string;
  source: string;
  published: string;
  category: string;
};

const RSS_SOURCES = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "crypto" },
  { name: "CoinTelegraph", url: "https://cointelegraph.com/rss", category: "crypto" },
  { name: "Decrypt", url: "https://decrypt.co/feed", category: "crypto" },
  { name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/feed", category: "bitcoin" },
  { name: "CryptoSlate", url: "https://cryptoslate.com/feed/", category: "crypto" },
];

async function fetchRSS(source: { name: string; url: string; category: string }): Promise<NewsItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "ArmataBot/1.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    // Simple XML parsing for RSS items
    const items: NewsItem[] = [];
    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

    for (const item of itemMatches.slice(0, 10)) {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";

      if (title && link) {
        items.push({
          title: title.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
          url: link.trim(),
          source: source.name,
          published: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          category: source.category,
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const allItems = await Promise.all(RSS_SOURCES.map(fetchRSS));
    const merged = allItems
      .flat()
      .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
      .slice(0, 50);

    return NextResponse.json({ news: merged, updated_at: new Date().toISOString() });
  } catch {
    return NextResponse.json({ news: [], error: "Eroare la încărcarea știrilor" });
  }
}

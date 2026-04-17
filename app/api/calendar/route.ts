import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache for 1 hour

type FFEvent = {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
};

type CalendarEvent = {
  title: string;
  titleRo: string;
  date: string;
  impact: "high" | "medium" | "low";
  forecast: string;
  previous: string;
  btcImpact: string | null;
};

const EVENT_TRANSLATIONS: Record<string, string> = {
  "CPI m/m": "Inflație CPI (lunar)",
  "CPI y/y": "Inflație CPI (anual)",
  "Core CPI m/m": "Inflație Core CPI (lunar)",
  "Core CPI y/y": "Inflație Core CPI (anual)",
  "PPI m/m": "Prețuri producători PPI (lunar)",
  "Core PPI m/m": "Prețuri producători Core PPI (lunar)",
  "Federal Funds Rate": "Rata dobânzii Fed",
  "FOMC Statement": "Declarația FOMC",
  "FOMC Meeting Minutes": "Minutele ședinței FOMC",
  "FOMC Press Conference": "Conferința de presă FOMC",
  "Non-Farm Employment Change": "Locuri de muncă non-agricole (NFP)",
  "Unemployment Rate": "Rata șomajului",
  "Average Hourly Earnings m/m": "Câștiguri medii orare (lunar)",
  "Advance GDP q/q": "PIB preliminar (trimestrial)",
  "Final GDP q/q": "PIB final (trimestrial)",
  "GDP q/q": "PIB (trimestrial)",
  "Retail Sales m/m": "Vânzări cu amănuntul (lunar)",
  "Core Retail Sales m/m": "Vânzări cu amănuntul Core (lunar)",
  "ISM Manufacturing PMI": "ISM Manufactură PMI",
  "ISM Services PMI": "ISM Servicii PMI",
  "CB Consumer Confidence": "Încredere consumatori",
  "Prelim UoM Consumer Sentiment": "Sentiment consumatori Michigan",
  "Final UoM Consumer Sentiment": "Sentiment consumatori Michigan (final)",
  "PCE Price Index m/m": "Inflație PCE (lunar)",
  "Core PCE Price Index m/m": "Inflație Core PCE (lunar)",
  "Crude Oil Inventories": "Stocuri de petrol",
  "Natural Gas Storage": "Stocuri gaze naturale",
  "Trade Balance": "Balanța comercială",
  "Current Account": "Cont curent",
  "Treasury Currency Report": "Raport Trezorerie",
  "Jackson Hole Symposium": "Simpozionul Jackson Hole",
};

const BTC_IMPACT_DATA: Record<string, string> = {
  "CPI m/m": "Sub așteptări: BTC +3-6%. Peste: BTC -3-4%.",
  "CPI y/y": "Sub așteptări: BTC +3-6%. Peste: BTC -3-4%.",
  "Core CPI m/m": "Similar CPI. Piața reacționează în 2-5 minute.",
  "Federal Funds Rate": "BTC negativ în 48h după 7 din 8 ședințe FOMC în 2025.",
  "FOMC Statement": "Tonul contează mai mult decât decizia. Limbaj pozitiv = BTC sus.",
  "Non-Farm Employment Change": "Sub așteptări = BTC sus (Fed taie ratele). Peste = BTC jos.",
  "Unemployment Rate": "Creștere = pozitiv crypto (Fed relaxează). Scădere = negativ.",
  "Advance GDP q/q": "PIB slab = pozitiv crypto (lichiditate). PIB puternic = negativ.",
  "PCE Price Index m/m": "Indicatorul preferat al Fed. Sub 0.2% = foarte pozitiv BTC.",
  "Core PCE Price Index m/m": "Cel mai important indicator de inflație. Sub 0.2% = pozitiv BTC.",
  "ISM Manufacturing PMI": "Sub 50 = contracție = pozitiv crypto. Peste 50 = negativ.",
  "Crude Oil Inventories": "Stocuri mari = petrol scade = inflație scade = pozitiv crypto.",
  "PPI m/m": "Anticipează CPI. Sub așteptări = pozitiv BTC.",
  "Retail Sales m/m": "Vânzări slabe = Fed relaxează = pozitiv crypto.",
  "CB Consumer Confidence": "Scăzut = economie slabă = Fed taie = pozitiv BTC.",
};

export async function GET() {
  try {
    const res = await fetch(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ events: [], error: "Calendar indisponibil" });
    }

    const rawEvents: FFEvent[] = await res.json();

    // Filter USD events with High or Medium impact
    const events: CalendarEvent[] = rawEvents
      .filter(
        (e) =>
          e.country === "USD" &&
          (e.impact === "High" || e.impact === "Medium")
      )
      .map((e) => ({
        title: e.title,
        titleRo: EVENT_TRANSLATIONS[e.title] ?? e.title,
        date: e.date,
        impact: e.impact.toLowerCase() as "high" | "medium",
        forecast: e.forecast || "-",
        previous: e.previous || "-",
        btcImpact: BTC_IMPACT_DATA[e.title] ?? null,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json({ events: [], error: "Eroare la încărcarea calendarului" });
  }
}

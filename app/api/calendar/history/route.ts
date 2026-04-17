import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache for 24 hours

type HistoricalEvent = {
  date: string;
  event: string;
  actual: string | number | null;
  previous: string | number | null;
  forecast: string | number | null;
  category: string;
  importance: number;
};

export async function GET() {
  try {
    const filePath = join(process.cwd(), "data", "economic_history.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as { fetched_at: string; events: HistoricalEvent[] };

    return NextResponse.json({
      fetched_at: data.fetched_at,
      events: data.events,
    });
  } catch {
    return NextResponse.json({ events: [], error: "Date istorice indisponibile" });
  }
}

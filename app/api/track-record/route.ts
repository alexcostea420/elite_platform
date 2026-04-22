import { readFileSync } from "fs";
import { NextResponse } from "next/server";

export const revalidate = 300; // Cache 5 minutes

const CACHE_FILE = "/Users/server/elite_platform/data/track_record_cache.json";

export async function GET() {
  try {
    const raw = readFileSync(CACHE_FILE, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ stats: null, error: "Date indisponibile" });
  }
}

import { readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 60; // Cache 1 minute (cron pushes every 5 min)

const LOCAL_CACHE = path.join(process.cwd(), "data", "track_record_cache.json");

export async function GET() {
  // Production: read mirror from Supabase trading_data (Mac Mini cron pushes here every 5 min).
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("trading_data")
      .select("data, updated_at")
      .eq("data_type", "track_record_cache")
      .maybeSingle();

    if (!error && data?.data) {
      return NextResponse.json(data.data);
    }
  } catch (error) {
    console.error("track-record Supabase read failed:", (error as Error).message);
  }

  // Local dev fallback: read the file directly.
  try {
    const raw = readFileSync(LOCAL_CACHE, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch (error) {
    console.error("track-record local cache read failed:", (error as Error).message);
    return NextResponse.json({ stats: null, error: "Date indisponibile" });
  }
}

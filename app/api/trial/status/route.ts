import { NextResponse } from "next/server";

// Global "1 trial per day" limit was removed (migration 015).
// Per-account guard (trial_used_at) is enforced inside claim_and_activate_trial.
// This endpoint stays for backwards-compatibility with existing UI components.
export async function GET() {
  return NextResponse.json({ available: true });
}

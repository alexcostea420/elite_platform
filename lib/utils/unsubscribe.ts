import crypto from "crypto";

const UNSUB_SECRET = process.env.CRON_SECRET ?? "unsub-fallback-key";

export function generateUnsubToken(email: string): string {
  return crypto.createHmac("sha256", UNSUB_SECRET).update(email).digest("hex").slice(0, 16);
}

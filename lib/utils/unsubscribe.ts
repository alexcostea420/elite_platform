import crypto from "crypto";

const TOKEN_EXPIRY_DAYS = 7;

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET env var is required");
  return secret;
}

export function generateUnsubToken(email: string, timestamp?: number): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const payload = `${email}:${ts}`;
  const hmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  // Encode timestamp + full 256-bit HMAC
  return `${ts.toString(36)}.${hmac}`;
}

export function verifyUnsubToken(email: string, token: string): boolean {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;

  const tsStr = token.slice(0, dotIndex);
  const ts = parseInt(tsStr, 36);
  if (isNaN(ts)) return false;

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (now - ts > TOKEN_EXPIRY_DAYS * 24 * 60 * 60) return false;

  // Verify HMAC
  const expected = generateUnsubToken(email, ts);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

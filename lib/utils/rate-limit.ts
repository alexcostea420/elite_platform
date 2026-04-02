const rateLimit = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimit.get(key);

  // Clean expired
  if (entry && now > entry.resetAt) {
    rateLimit.delete(key);
  }

  const current = rateLimit.get(key);

  if (!current) {
    rateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  current.count++;
  return { allowed: true, remaining: limit - current.count };
}

// Simple in-memory rate limiter
// Tracks requests per IP address within a sliding time window
// For production at scale, replace with Upstash Redis

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const requests = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (now > entry.resetTime) {
      requests.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(
  ip: string,
  {
    maxRequests = 10,
    windowMs = 60 * 1000, // 1 minute default
  }: { maxRequests?: number; windowMs?: number } = {}
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now > entry.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: maxRequests - entry.count };
}

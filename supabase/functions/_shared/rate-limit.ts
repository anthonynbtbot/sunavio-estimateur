// Shared per-IP rate limiter. Stores SHA-256 hashed IP only (RGPD).
// 10 requests / hour / endpoint by default.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export async function hashIp(ip: string): Promise<string> {
  const enc = new TextEncoder().encode(ip);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: string;
}

export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  ip: string,
  endpoint: string,
  limit = 10,
): Promise<RateLimitResult> {
  if (ip === "unknown") return { allowed: true };
  const ipHash = await hashIp(ip);
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);

  // Try increment first (UPSERT pattern).
  const { data: existing } = await supabase
    .from("ai_rate_limit")
    .select("id, count")
    .eq("ip_hash", ipHash)
    .eq("endpoint", endpoint)
    .eq("window_start", windowStart.toISOString())
    .maybeSingle();

  if (!existing) {
    await supabase.from("ai_rate_limit").insert({
      ip_hash: ipHash,
      endpoint,
      window_start: windowStart.toISOString(),
      count: 1,
    });
    return { allowed: true };
  }

  if ((existing.count as number) >= limit) {
    const retryAt = new Date(windowStart.getTime() + 60 * 60 * 1000);
    return { allowed: false, retryAfter: retryAt.toISOString() };
  }

  await supabase
    .from("ai_rate_limit")
    .update({ count: (existing.count as number) + 1 })
    .eq("id", existing.id);
  return { allowed: true };
}

// Shared guard for AI edge functions that mutate a lead row.
// Public estimation flow has no auth, so we restrict writes to leads created
// recently (default 30 minutes). The DB trigger on roof analysis still passes
// the service-role bearer, which is detected and allowed.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface LeadGuardOptions {
  /** Max age in minutes a lead can be to allow public mutations. Default 30. */
  maxAgeMinutes?: number;
}

export interface LeadGuardResult {
  allowed: boolean;
  reason?: "lead_not_found" | "lead_too_old";
  isServiceCall: boolean;
}

export function isServiceRoleCall(req: Request): boolean {
  const authHeader = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return serviceKey.length > 0 && authHeader === `Bearer ${serviceKey}`;
}

export async function guardLeadMutation(
  supabase: SupabaseClient,
  req: Request,
  leadId: string,
  opts: LeadGuardOptions = {},
): Promise<LeadGuardResult> {
  const isServiceCall = isServiceRoleCall(req);
  if (isServiceCall) return { allowed: true, isServiceCall: true };

  const maxAgeMinutes = opts.maxAgeMinutes ?? 30;
  const { data, error } = await supabase
    .from("leads")
    .select("id, created_at")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data) return { allowed: false, reason: "lead_not_found", isServiceCall };

  const createdAt = new Date(data.created_at as string).getTime();
  const ageMs = Date.now() - createdAt;
  if (ageMs > maxAgeMinutes * 60 * 1000) {
    return { allowed: false, reason: "lead_too_old", isServiceCall };
  }
  return { allowed: true, isServiceCall };
}

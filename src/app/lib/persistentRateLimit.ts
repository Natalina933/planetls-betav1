import { createClient } from "@supabase/supabase-js";

type RateLimitOptions = {
  action: string;
  key: string;
  ip?: string | null;
  windowMs: number;
  maxAttempts: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfter?: number;
};

function getRateLimitClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Configuration Supabase manquante pour le rate limiting.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function consumePersistentRateLimit({
  action,
  key,
  ip,
  windowMs,
  maxAttempts,
}: RateLimitOptions): Promise<RateLimitResult> {
  const client = getRateLimitClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const { data: existingRow, error: readError } = await client
    .from("rate_limit_attempts")
    .select("action_key, attempts, window_started_at")
    .eq("action_key", key)
    .eq("action", action)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  const windowStartedAt = existingRow?.window_started_at
    ? new Date(existingRow.window_started_at).getTime()
    : now;
  const isWindowExpired = !existingRow || Number.isNaN(windowStartedAt) || now - windowStartedAt >= windowMs;

  if (isWindowExpired) {
    const { error: insertError } = await client.from("rate_limit_attempts").upsert(
      {
        action,
        action_key: key,
        ip_address: ip ?? null,
        attempts: 1,
        window_started_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "action_key" },
    );

    if (insertError) {
      throw insertError;
    }

    return { allowed: true };
  }

  const attempts = Number(existingRow.attempts ?? 0);
  if (attempts >= maxAttempts) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - windowStartedAt)) / 1000));
    return { allowed: false, retryAfter };
  }

  const { error: updateError } = await client
    .from("rate_limit_attempts")
    .update({
      attempts: attempts + 1,
      ip_address: ip ?? null,
      updated_at: nowIso,
    })
    .eq("action_key", key)
    .eq("action", action);

  if (updateError) {
    throw updateError;
  }

  return { allowed: true };
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-forwarded-for, x-real-ip",
};

// In-memory store for rate limiting (resets on cold start, but provides protection)
const loginAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil: number | null }>();

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window for counting attempts

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

function getAttemptKey(email: string, ip: string): string {
  return `${email.toLowerCase()}:${ip}`;
}

function checkAndUpdateAttempts(
  key: string,
  isSuccess: boolean
): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  let record = loginAttempts.get(key);

  // Clean up expired records
  if (record) {
    // If lockout has expired, reset
    if (record.lockedUntil && now > record.lockedUntil) {
      record = { count: 0, firstAttempt: now, lockedUntil: null };
      loginAttempts.set(key, record);
    }
    // If attempt window has expired (and not locked), reset
    else if (!record.lockedUntil && now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
      record = { count: 0, firstAttempt: now, lockedUntil: null };
      loginAttempts.set(key, record);
    }
  }

  // Check if currently locked
  if (record?.lockedUntil && now < record.lockedUntil) {
    console.log(`[secure-login] Account locked for key: ${key.split(":")[0].substring(0, 3)}***`);
    return { allowed: false, remainingAttempts: 0 };
  }

  // Success - reset attempts
  if (isSuccess) {
    loginAttempts.delete(key);
    console.log(`[secure-login] Successful login, resetting attempts for key`);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Failed attempt
  if (!record) {
    record = { count: 1, firstAttempt: now, lockedUntil: null };
  } else {
    record.count += 1;
  }

  // Check if we should lock
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    console.log(`[secure-login] Account locked after ${record.count} attempts`);
  }

  loginAttempts.set(key, record);

  const remaining = Math.max(0, MAX_ATTEMPTS - record.count);
  return { allowed: record.count < MAX_ATTEMPTS, remainingAttempts: remaining };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Health check
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ success: true, version: "1.0.0", service: "secure-login" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { email, password } = await req.json();
    const clientIP = getClientIP(req);

    console.log(`[secure-login] Login attempt for: ${email?.substring(0, 3)}*** from IP: ${clientIP.substring(0, 8)}***`);

    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and password are required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const attemptKey = getAttemptKey(email, clientIP);

    // Check if allowed to attempt
    const preCheck = checkAndUpdateAttempts(attemptKey, false);
    
    // Undo the increment we just did (we only want to count actual failed auth)
    const record = loginAttempts.get(attemptKey);
    if (record && record.count > 0 && !record.lockedUntil) {
      record.count -= 1;
      loginAttempts.set(attemptKey, record);
    }

    // If locked, return generic error (don't reveal lockout to attacker)
    if (!preCheck.allowed && record?.lockedUntil) {
      console.log(`[secure-login] Blocked attempt - account is locked`);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid credentials" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client to perform the login
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Use anon key client for auth (service role can't sign in users)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Record failed attempt
      const result = checkAndUpdateAttempts(attemptKey, false);
      console.log(`[secure-login] Failed login - remaining attempts: ${result.remainingAttempts}`);

      // Return generic error message (don't expose details)
      return new Response(
        JSON.stringify({ success: false, error: "Invalid credentials" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success - clear attempt record
    checkAndUpdateAttempts(attemptKey, true);

    console.log(`[secure-login] Successful login for user`);

    return new Response(
      JSON.stringify({
        success: true,
        session: data.session,
        user: data.user,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[secure-login] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
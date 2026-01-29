import { createClient } from "npm:@supabase/supabase-js@2.87.1";

// Canonical CORS headers for Supabase Edge Functions.
// Keep this STATIC and include it on *every* response (success + errors).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  // Proves whether the request reaches the function at all.
  console.log("[dismiss-issue] function entered", { method: req.method });

  // Handle CORS preflight requests.
  if (req.method === "OPTIONS") {
    console.log("[dismiss-issue] OPTIONS preflight");
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { success: false, error: "Method Not Allowed" });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { success: false, error: "Unauthorized" });
    }

    // Parse body
    let body: { id?: unknown; action?: unknown };
    try {
      body = await req.json();
    } catch (e) {
      console.error("[dismiss-issue] Invalid JSON body", e);
      return json(400, { success: false, error: "Invalid JSON body" });
    }

    const { id, action } = body ?? {};
    console.log("[dismiss-issue] Request received", { id, action });

    if (action !== "dismiss") {
      return json(400, { success: false, error: "Invalid action. Expected 'dismiss'" });
    }

    const issueId = typeof id === "number" ? id : parseInt(String(id), 10);
    if (!Number.isFinite(issueId) || issueId <= 0) {
      return json(400, { success: false, error: "Invalid issue ID" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("[dismiss-issue] Missing env vars", {
        hasUrl: !!supabaseUrl,
        hasAnon: !!supabaseAnonKey,
        hasService: !!supabaseServiceKey,
      });
      return json(500, { success: false, error: "Server misconfigured" });
    }

    // Auth validation (verify_jwt=false in config => validate manually)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.slice("Bearer ".length);
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("[dismiss-issue] getClaims failed", claimsError);
      return json(401, { success: false, error: "Unauthorized" });
    }

    const userId = claimsData.claims.sub;
    console.log("[dismiss-issue] Auth OK", { userId });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Role check (roles live ONLY in user_roles table)
    const { data: employeeRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "employee")
      .limit(1)
      .maybeSingle();

    if (roleError) {
      console.error("[dismiss-issue] Role lookup failed", roleError);
      return json(500, { success: false, error: "Role lookup failed" });
    }

    if (!employeeRole) {
      console.warn("[dismiss-issue] Forbidden (not employee)", { userId });
      return json(403, { success: false, error: "Only employees can dismiss issues" });
    }

    console.log("[dismiss-issue] Role OK", { userId, issueId });

    // Pre-check (idempotent)
    const { data: existingIssue, error: existingError } = await supabaseAdmin
      .from("issues")
      .select("id, dismissed_at")
      .eq("id", issueId)
      .maybeSingle();

    if (existingError) {
      console.error("[dismiss-issue] Pre-check failed", existingError);
      return json(500, { success: false, error: "Unable to verify issue" });
    }

    if (!existingIssue || existingIssue.dismissed_at) {
      console.log("[dismiss-issue] Idempotent success", {
        issueId,
        existed: !!existingIssue,
        alreadyDismissed: !!existingIssue?.dismissed_at,
      });
      return json(200, { success: true, action: "dismissed", id: issueId });
    }

    // Soft delete
    const now = new Date().toISOString();
    const { data: updatedIssue, error: updateError } = await supabaseAdmin
      .from("issues")
      .update({ dismissed_at: now })
      .eq("id", issueId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("[dismiss-issue] Soft delete update failed", updateError);
      return json(500, { success: false, error: updateError.message });
    }

    if (!updatedIssue) {
      console.error("[dismiss-issue] Update returned no row", { issueId });
      return json(500, { success: false, error: "Dismiss failed: issue not updated" });
    }

    console.log("[dismiss-issue] Soft delete OK", { issueId, dismissed_at: now });
    return json(200, { success: true, action: "dismissed", id: issueId });
  } catch (err) {
    console.error("[dismiss-issue] Unexpected error", err);
    return json(500, {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

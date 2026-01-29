import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // Include GET as well to be resilient to platform/proxy variations.
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    // Must include every header the browser announces in Access-Control-Request-Headers.
    // Supabase clients may include additional x-supabase-* headers depending on version/platform.
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { id, action } = body;

    console.log("[dismiss-issue] Request received:", { id, action });

    // Validate input
    if (action !== "dismiss") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid action. Expected 'dismiss'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const issueId = typeof id === "number" ? id : parseInt(String(id), 10);
    if (!Number.isFinite(issueId) || issueId <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid issue ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client for auth validation
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("[dismiss-issue] Auth error:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("[dismiss-issue] Authenticated user:", userId);

    // Create admin client for role check and deletion
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user has employee role (avoid .single() to prevent failures if multiple roles exist)
    const { data: employeeRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "employee")
      .maybeSingle();

    if (roleError) {
      console.error("[dismiss-issue] Role lookup error:", roleError);
      return new Response(
        JSON.stringify({ success: false, error: "Role lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!employeeRole) {
      console.error("[dismiss-issue] Forbidden: not employee", { userId });
      return new Response(
        JSON.stringify({ success: false, error: "Only employees can dismiss issues" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[dismiss-issue] Employee verified", { userId, issueId });

    // Idempotency: if already absent, return success.
    const { data: existingIssue, error: existingError } = await supabaseAdmin
      .from("issues")
      .select("id")
      .eq("id", issueId)
      .maybeSingle();

    if (existingError) {
      console.error("[dismiss-issue] Pre-check select error:", existingError);
      return new Response(
        JSON.stringify({ success: false, error: "Unable to verify issue existence" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!existingIssue) {
      console.log("[dismiss-issue] Issue already absent (idempotent success)", { issueId });
      return new Response(
        JSON.stringify({ success: true, action: "dismissed", id: issueId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[dismiss-issue] Soft-deleting issue", { issueId });

    const { data: updatedIssue, error: updateError } = await supabaseAdmin
      .from("issues")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", issueId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("[dismiss-issue] Update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!updatedIssue) {
      console.error("[dismiss-issue] Update returned no data", { issueId });
      return new Response(
        JSON.stringify({ success: false, error: "Dismiss failed: issue not found or not updated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[dismiss-issue] Issue soft-deleted successfully", { issueId });

    return new Response(
      JSON.stringify({ success: true, action: "dismissed", id: issueId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[dismiss-issue] Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

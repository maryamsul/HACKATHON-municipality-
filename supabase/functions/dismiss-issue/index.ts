import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Static CORS headers - guaranteed to work with Supabase client
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  console.log("[dismiss-issue] Function entered", { method: req.method, url: req.url });

  // Handle CORS preflight - MUST return 200 or 204 with headers
  if (req.method === "OPTIONS") {
    console.log("[dismiss-issue] Handling OPTIONS preflight");
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    console.log("[dismiss-issue] Method not allowed:", req.method);
    return new Response(
      JSON.stringify({ success: false, error: "Method Not Allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Check auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[dismiss-issue] Missing or invalid auth header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: { id?: unknown; action?: unknown };
    try {
      body = await req.json();
    } catch {
      console.error("[dismiss-issue] Invalid JSON body");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { id, action } = body;
    console.log("[dismiss-issue] Request body:", { id, action });

    // Validate action
    if (action !== "dismiss") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid action. Expected 'dismiss'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate issue ID
    const issueId = typeof id === "number" ? id : parseInt(String(id), 10);
    if (!Number.isFinite(issueId) || issueId <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid issue ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client for auth validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("[dismiss-issue] Missing environment variables");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);

    if (claimsError || !claimsData?.user) {
      console.error("[dismiss-issue] Auth error:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    console.log("[dismiss-issue] Authenticated user:", userId);

    // Create admin client for role check and soft delete
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has employee role
    const { data: employeeRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "employee")
      .limit(1)
      .maybeSingle();

    if (roleError) {
      console.error("[dismiss-issue] Role lookup error:", roleError);
      return new Response(
        JSON.stringify({ success: false, error: "Role lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!employeeRole) {
      console.log("[dismiss-issue] Forbidden: user is not an employee", { userId });
      return new Response(
        JSON.stringify({ success: false, error: "Only employees can dismiss issues" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[dismiss-issue] Employee verified, proceeding with soft delete", { userId, issueId });

    // Check if issue exists and is not already dismissed
    const { data: existingIssue, error: existingError } = await supabaseAdmin
      .from("issues")
      .select("id, dismissed_at")
      .eq("id", issueId)
      .maybeSingle();

    if (existingError) {
      console.error("[dismiss-issue] Pre-check error:", existingError);
      return new Response(
        JSON.stringify({ success: false, error: "Unable to verify issue existence" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotent: if already dismissed or doesn't exist, return success
    if (!existingIssue || existingIssue.dismissed_at) {
      console.log("[dismiss-issue] Already dismissed or absent (idempotent success)", { issueId });
      return new Response(
        JSON.stringify({ success: true, action: "dismissed", id: issueId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Soft delete: set dismissed_at timestamp
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

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

console.info("[dismiss-issue] Edge function started");

serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[dismiss-issue][${requestId}] function entered`, { method: req.method, url: req.url });

  // CORS preflight
  if (req.method === "OPTIONS") {
    console.log(`[dismiss-issue][${requestId}] OPTIONS preflight`);
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed", requestId }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error(`[dismiss-issue][${requestId}] Missing Authorization header`);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized", requestId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      console.error(`[dismiss-issue][${requestId}] Empty JWT token`);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized", requestId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error(`[dismiss-issue][${requestId}] JWT validation failed:`, claimsError);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized", requestId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = String(claimsData.claims.sub);
    console.log(`[dismiss-issue][${requestId}] Authenticated user:`, userId);

    // Parse payload
    const payload = await req.json();
    const { id, action } = payload ?? {};
    console.log(`[dismiss-issue][${requestId}] Payload:`, JSON.stringify({ id, action }));

    if (action !== "dismiss") {
      return new Response(JSON.stringify({ success: false, error: "Invalid action", requestId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const issueId = Number(id);
    if (!Number.isFinite(issueId) || issueId <= 0) {
      return new Response(JSON.stringify({ success: false, error: "Invalid issue ID", requestId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Role check
    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "employee")
      .maybeSingle();

    console.log(
      `[dismiss-issue][${requestId}] Role check - roleRow:`,
      JSON.stringify(roleRow),
      "| error:",
      roleError,
    );

    if (roleError) {
      return new Response(JSON.stringify({ success: false, error: "Role lookup failed", requestId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!roleRow) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden: Employee access required", requestId }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-check (idempotent)
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("issues")
      .select("id, dismissed_at")
      .eq("id", issueId)
      .maybeSingle();

    console.log(
      `[dismiss-issue][${requestId}] Existing check:`,
      JSON.stringify(existing),
      "| error:",
      existingError,
    );

    if (existingError) {
      return new Response(JSON.stringify({ success: false, error: existingError.message, requestId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!existing || existing.dismissed_at) {
      return new Response(JSON.stringify({ success: true, action: "dismissed", id: issueId, requestId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Soft delete
    const { data: updatedIssue, error: updateError } = await supabaseAdmin
      .from("issues")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", issueId)
      .select("id")
      .maybeSingle();

    console.log(
      `[dismiss-issue][${requestId}] Soft delete result - updated:`,
      JSON.stringify(updatedIssue),
      "| error:",
      updateError,
    );

    if (updateError) {
      return new Response(JSON.stringify({ success: false, error: updateError.message, requestId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!updatedIssue) {
      return new Response(JSON.stringify({ success: false, error: "Dismiss failed: issue not updated", requestId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, action: "dismissed", id: issueId, requestId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[dismiss-issue][${requestId}] Unhandled error:`, message);
    return new Response(JSON.stringify({ success: false, error: message, requestId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

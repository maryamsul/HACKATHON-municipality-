// classify-report edge function - handles status updates and issue dismissal
// Version: 2.0.0 - All responses return HTTP 200, dismiss is idempotent
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERSION = "2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  // Health check endpoint (GET request)
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ success: true, version: VERSION, requestId, message: "classify-report is healthy" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 2. Auth Check - Get Authorization header
    // NOTE: verify_jwt is disabled in config.toml, so we must validate JWT in code.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[classify-report][" + requestId + "] Missing or invalid Authorization header");
      // Always return 200 to avoid client crashes from non-2xx responses.
      return new Response(JSON.stringify({ success: false, error: "Unauthorized", requestId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      console.error("[classify-report][" + requestId + "] Empty JWT token");
      return new Response(JSON.stringify({ success: false, error: "Unauthorized", requestId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("[classify-report][" + requestId + "] JWT validation failed:", claimsError);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized", requestId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = String(claimsData.claims.sub);
    console.log("[classify-report][" + requestId + "] Authenticated user (claims.sub):", userId);

    // 3. Role Check using service role client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "employee")
      .maybeSingle();

    console.log("[classify-report][" + requestId + "] Role check - roleRow:", JSON.stringify(roleRow), "| error:", roleError);

    if (!roleRow) {
      console.error("[classify-report][" + requestId + "] User is not an employee");
      return new Response(JSON.stringify({ success: false, error: "Forbidden: Employee access required", requestId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Parse Payload
    const payload = await req.json();
    console.log("[classify-report][" + requestId + "] Received payload:", JSON.stringify(payload));
    
    const table = payload.type === "building" ? "buildings_at_risk" : "issues";

    // Buildings use UUID (string), Issues use ID (number)
    let queryId: string | number;
    if (payload.type === "building") {
      queryId = String(payload.id);
    } else {
      const issueId = Number(payload.id);
      if (!Number.isFinite(issueId) || issueId <= 0) {
        console.error("[classify-report][" + requestId + "] Invalid issue id:", payload.id);
        return new Response(JSON.stringify({ success: false, error: "Invalid id", requestId }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      queryId = issueId;
    }
    console.log(
      "[classify-report][" + requestId + "] Table:",
      table,
      "| QueryId:",
      queryId,
      "| Type:",
      typeof queryId,
      "| Action:",
      payload.action,
    );

    // 5. Handle DISMISS action (soft delete for issues via dismissed_at)
    if (payload.action === "dismiss") {
      console.log("[classify-report][" + requestId + "] Processing DISMISS for", table, "id:", queryId);

      if (table === "issues") {
        // Check if issue exists and its current state
        const { data: existing, error: existingError } = await supabaseAdmin
          .from("issues")
          .select("id, dismissed_at")
          .eq("id", queryId)
          .maybeSingle();

        if (existingError) {
          console.error("[classify-report][" + requestId + "] Dismiss lookup error:", existingError);
          return new Response(JSON.stringify({ success: false, error: existingError.message, requestId }), {
            status: 200, // Return 200 to avoid runtime errors
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Idempotent: if missing or already dismissed, return success
        if (!existing || existing.dismissed_at) {
          console.log("[classify-report][" + requestId + "] Dismiss idempotent - already dismissed or not found:", queryId);
          return new Response(JSON.stringify({ success: true, action: "dismissed", id: queryId, requestId }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Soft delete: set dismissed_at timestamp
        const { data: updated, error: updateError } = await supabaseAdmin
          .from("issues")
          .update({ dismissed_at: new Date().toISOString() })
          .eq("id", queryId)
          .select("id")
          .maybeSingle();

        if (updateError) {
          console.error("[classify-report][" + requestId + "] Dismiss update error:", updateError);
          return new Response(JSON.stringify({ success: false, error: updateError.message, requestId }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("[classify-report][" + requestId + "] Issue dismissed successfully:", queryId);
        return new Response(JSON.stringify({ success: true, action: "dismissed", id: queryId, requestId }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Buildings: hard delete (no dismissed_at column)
      const { error: deleteError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("id", queryId);

      if (deleteError) {
        console.error("[classify-report][" + requestId + "] Building delete error:", deleteError);
        return new Response(JSON.stringify({ success: false, error: deleteError.message, requestId }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("[classify-report][" + requestId + "] Building dismissed successfully:", queryId);
      return new Response(JSON.stringify({ success: true, action: "dismissed", id: queryId, requestId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Handle STATUS UPDATE
    const updateData: Record<string, unknown> = {};
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.assigned_to !== undefined) updateData.assigned_to = payload.assigned_to;

    console.log("[classify-report][" + requestId + "] Updating with data:", JSON.stringify(updateData));

    const { data, error: dbError } = await supabaseAdmin
      .from(table)
      .update(updateData)
      .eq("id", queryId)
      .select();

    if (dbError) {
      console.error("[classify-report][" + requestId + "] Update error:", dbError);
      return new Response(JSON.stringify({ success: false, error: dbError.message, requestId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data || data.length === 0) {
      console.warn("[classify-report][" + requestId + "] No record found for update:", queryId);
      return new Response(JSON.stringify({ success: false, error: "Record not found", requestId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[classify-report][" + requestId + "] Successfully updated:", queryId);
    return new Response(JSON.stringify({ success: true, data: data[0], requestId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[classify-report][" + requestId + "] Caught error:", message);
    return new Response(JSON.stringify({ success: false, error: message, requestId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

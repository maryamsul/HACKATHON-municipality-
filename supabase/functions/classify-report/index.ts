// classify-report edge function - handles status updates and issue dismissal
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
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
      console.error("[classify-report] Missing or invalid Authorization header");
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      console.error("[classify-report] Empty JWT token");
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("[classify-report] JWT validation failed:", claimsError);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = String(claimsData.claims.sub);
    console.log("[classify-report] Authenticated user (claims.sub):", userId);

    // 3. Role Check using service role client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "employee")
      .maybeSingle();

    console.log("[classify-report] Role check - roleRow:", JSON.stringify(roleRow), "| error:", roleError);

    if (!roleRow) {
      console.error("[classify-report] User is not an employee");
      return new Response(JSON.stringify({ success: false, error: "Forbidden: Employee access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Parse Payload
    const payload = await req.json();
    console.log("[classify-report] Received payload:", JSON.stringify(payload));
    
    const table = payload.type === "building" ? "buildings_at_risk" : "issues";

    // Buildings use UUID (string), Issues use ID (number)
    let queryId: string | number;
    if (payload.type === "building") {
      queryId = String(payload.id);
    } else {
      const issueId = Number(payload.id);
      if (!Number.isFinite(issueId) || issueId <= 0) {
        console.error("[classify-report] Invalid issue id:", payload.id);
        return new Response(JSON.stringify({ success: false, error: "Invalid id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      queryId = issueId;
    }
    console.log("[classify-report] Table:", table, "| QueryId:", queryId, "| Type:", typeof queryId, "| Action:", payload.action);

    // 5. Handle Dismiss Action
    if (payload.action === "dismiss") {
      console.log("[classify-report] Processing DISMISS action for", table, "id:", queryId);

      // Issues: soft dismiss using dismissed_at to support dismissed_at filters.
      if (table === "issues") {
        const { data: existingIssue, error: existingError } = await supabaseAdmin
          .from("issues")
          .select("id, dismissed_at")
          .eq("id", queryId)
          .maybeSingle();

        console.log(
          "[classify-report] Issue dismiss existing check:",
          JSON.stringify(existingIssue),
          "| error:",
          existingError,
        );

        if (existingError) {
          return new Response(JSON.stringify({ success: false, error: existingError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Idempotent: treat missing/already dismissed as success
        if (!existingIssue || existingIssue.dismissed_at) {
          return new Response(JSON.stringify({ success: true, action: "dismissed", id: queryId }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: updated, error: updateError } = await supabaseAdmin
          .from("issues")
          .update({ dismissed_at: new Date().toISOString() })
          .eq("id", queryId)
          .select("id")
          .maybeSingle();

        console.log(
          "[classify-report] Issue dismiss update:",
          JSON.stringify(updated),
          "| error:",
          updateError,
        );

        if (updateError) {
          return new Response(JSON.stringify({ success: false, error: updateError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!updated) {
          return new Response(JSON.stringify({ success: false, error: "Dismiss failed: issue not updated" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, action: "dismissed", id: queryId }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Buildings: keep hard delete behavior (no dismissed_at column there).
      const { data: existingRow, error: existingError } = await supabaseAdmin
        .from(table)
        .select("id")
        .eq("id", queryId)
        .maybeSingle();

      console.log(
        "[classify-report] Dismiss existence check - row:",
        JSON.stringify(existingRow),
        "| error:",
        existingError,
      );

      if (existingError) {
        console.error("[classify-report] Existence check error:", existingError);
        return new Response(JSON.stringify({ success: false, error: existingError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!existingRow) {
        console.error("[classify-report] No record found to delete with id:", queryId);
        return new Response(JSON.stringify({ success: false, error: "Record not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("id", queryId);

      console.log("[classify-report] Delete result - error:", deleteError);

      if (deleteError) {
        console.error("[classify-report] Delete error:", deleteError);
        return new Response(JSON.stringify({ success: false, error: deleteError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("[classify-report] Successfully deleted record:", queryId);
      return new Response(JSON.stringify({ success: true, action: "dismissed", id: queryId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Update Database (status change)
    const updateData: Record<string, unknown> = {};
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.assigned_to !== undefined) updateData.assigned_to = payload.assigned_to;

    console.log("[classify-report] Updating with data:", JSON.stringify(updateData));

    const { data, error: dbError } = await supabaseAdmin
      .from(table)
      .update(updateData)
      .eq("id", queryId)
      .select();

    if (dbError) {
      console.error("[classify-report] Update error:", dbError);
      return new Response(JSON.stringify({ success: false, error: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data || data.length === 0) {
      console.error("[classify-report] No record found for update with id:", queryId);
      return new Response(JSON.stringify({ success: false, error: "Record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[classify-report] Successfully updated record:", queryId);
    // 7. SUCCESS RESPONSE
    return new Response(JSON.stringify({ success: true, data: data[0] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[classify-report] Caught error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

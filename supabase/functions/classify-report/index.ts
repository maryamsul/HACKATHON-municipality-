import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReportType = "building" | "issue";

// Database status values - EXACT match to DB constraints (case-sensitive!)
// Buildings: pending | Critical | Under Inspection | Resolved
// Issues: Under Review | Under Maintenance | Resolved
type BuildingStatus = "pending" | "Critical" | "Under Inspection" | "Resolved";
type IssueStatus = "Under Review" | "Under Maintenance" | "Resolved";

interface Payload {
  type: ReportType;
  id: string | number;
  status: string;
  assigned_to?: string | null;
}

// Validate building status matches exact DB enum
function isAllowedBuildingStatus(s: string): s is BuildingStatus {
  return s === "pending" || s === "Critical" || s === "Under Inspection" || s === "Resolved";
}

// Validate issue status matches exact DB enum
function isAllowedIssueStatus(s: string): s is IssueStatus {
  return s === "Under Review" || s === "Under Maintenance" || s === "Resolved";
}

serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed", requestId }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error(`[${requestId}] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY`);
      return new Response(JSON.stringify({ success: false, error: "Server configuration error", requestId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Missing Authorization header", requestId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Client for validating the JWT
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData.user) {
      console.error(`[${requestId}] auth.getUser error:`, userError);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized", requestId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for role check + updates (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "employee")
      .maybeSingle();

    if (roleError) {
      console.error(`[${requestId}] role lookup error:`, roleError);
      return new Response(JSON.stringify({ success: false, error: "Role check failed", requestId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!roleRow) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden", requestId }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: Payload;
    try {
      payload = (await req.json()) as Payload;
    } catch (e) {
      console.error(`[${requestId}] Invalid JSON`, e);
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON payload", requestId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload?.type || (payload.id === undefined || payload.id === null) || !payload.status) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields", requestId, details: "type, id, status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Handle building status update
    if (payload.type === "building") {
      if (!isAllowedBuildingStatus(payload.status)) {
        console.error(`[${requestId}] Invalid building status: ${payload.status}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Invalid building status", 
            requestId,
            details: `Status must be one of: pending, Critical, Under Inspection, Resolved. Got: ${payload.status}`
          }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = { status: payload.status };
      if (payload.assigned_to !== undefined) updates.assigned_to = payload.assigned_to;

      console.log(`[${requestId}] Updating building ${payload.id} to status: ${payload.status}`);

      const { data, error } = await supabaseAdmin
        .from("buildings_at_risk")
        .update(updates)
        .eq("id", String(payload.id))
        .select("*")
        .single();

      if (error) {
        console.error(`[${requestId}] building update error:`, error);
        return new Response(JSON.stringify({ success: false, error: error.message, requestId }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[${requestId}] Building updated successfully:`, data);
      return new Response(JSON.stringify({ success: true, data, requestId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle issue status update
    if (!isAllowedIssueStatus(payload.status)) {
      console.error(`[${requestId}] Invalid issue status: ${payload.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid issue status", 
          requestId,
          details: `Status must be one of: Under Review, Under Maintenance, Resolved. Got: ${payload.status}`
        }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updates: Record<string, unknown> = { status: payload.status };
    if (payload.assigned_to !== undefined) updates.assigned_to = payload.assigned_to;

    console.log(`[${requestId}] Updating issue ${payload.id} to status: ${payload.status}`);

    const { data, error } = await supabaseAdmin
      .from("issues")
      .update(updates)
      .eq("id", Number(payload.id))
      .select("*")
      .single();

    if (error) {
      console.error(`[${requestId}] issue update error:`, error);
      return new Response(JSON.stringify({ success: false, error: error.message, requestId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${requestId}] Issue updated successfully:`, data);
    return new Response(JSON.stringify({ success: true, data, requestId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[${requestId}] Unhandled error:`, e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error", requestId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReportType = "building" | "issue";

// NOTE: buildings_at_risk historically used legacy status values like:
// - under_review (maps to UI: critical)
// - under_inspection / in_progress (maps to UI: under_maintenance)
// The UI now uses: pending | critical | under_maintenance | resolved
// This function accepts BOTH and normalizes writes to the legacy values to
// avoid DB constraint issues in older projects.
type BuildingStatus =
  | "pending"
  | "critical"
  | "under_maintenance"
  | "resolved"
  | "under_review"
  | "under_inspection"
  | "in_progress"
  | "in-progress"
  | "reported";
type IssueStatus = "pending" | "under_review" | "under_maintenance" | "resolved";

interface Payload {
  type: ReportType;
  id: string | number;
  status: string;
  assigned_to?: string | null;
}

function isAllowedBuildingStatus(s: string): s is BuildingStatus {
  return (
    s === "pending" ||
    s === "resolved" ||
    s === "critical" ||
    s === "under_maintenance" ||
    s === "under_review" ||
    s === "under_inspection" ||
    s === "in_progress" ||
    s === "in-progress" ||
    s === "reported"
  );
}

function isAllowedIssueStatus(s: string): s is IssueStatus {
  return s === "pending" || s === "under_review" || s === "under_maintenance" || s === "resolved";
}

/**
 * Maps UI building statuses to database-compatible values.
 * 
 * Database only supports: "pending" and "resolved"
 * UI allows: "pending", "critical", "under_maintenance", "resolved"
 * 
 * Mapping:
 *   - critical → pending (employees mark as critical, stored as pending for review)
 *   - under_maintenance → pending (employees mark as under maintenance, stored as pending)
 *   - pending → pending
 *   - resolved → resolved
 *   - All other legacy values → pending
 */
function toBuildingDbStatus(status: BuildingStatus): string {
  switch (status) {
    case "resolved":
      return "resolved";
    case "pending":
    case "critical":
    case "under_maintenance":
    case "under_review":
    case "under_inspection":
    case "in_progress":
    case "in-progress":
    case "reported":
    default:
      // All non-resolved statuses map to "pending" in the database
      return "pending";
  }
}

/**
 * Returns candidate status values to try when updating a building.
 * Since the database only supports "pending" and "resolved", we only need
 * to try those two values.
 * 
 * Mapping:
 *   - resolved → try ["resolved"]
 *   - everything else (critical, under_maintenance, pending, etc.) → try ["pending"]
 */
function getBuildingStatusCandidates(status: BuildingStatus): string[] {
  if (status === "resolved") {
    return ["resolved"];
  }
  // All other statuses (critical, under_maintenance, pending, etc.) map to pending
  return ["pending"];
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

    if (payload.type === "building") {
      if (!isAllowedBuildingStatus(payload.status)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid building status", requestId }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const candidates = getBuildingStatusCandidates(payload.status);
      let lastError: unknown = null;
      let updatedRow: Record<string, unknown> | null = null;
      let appliedStatus: string | null = null;

      for (const candidate of candidates) {
        const updates: Record<string, unknown> = { status: candidate };
        if (payload.assigned_to !== undefined) updates.assigned_to = payload.assigned_to;

        const { data, error } = await supabaseAdmin
          .from("buildings_at_risk")
          .update(updates)
          .eq("id", String(payload.id))
          .select("*")
          .single();

        if (!error) {
          updatedRow = data as unknown as Record<string, unknown>;
          appliedStatus = candidate;
          break;
        }

        lastError = error;
        console.warn(`[${requestId}] building update failed for status='${candidate}', trying next`, error);
      }

      if (!updatedRow) {
        console.error(`[${requestId}] building update error (all candidates failed):`, lastError);
        const msg = (lastError as any)?.message || "Update failed";
        return new Response(JSON.stringify({ success: false, error: msg, requestId, tried: candidates }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, data: updatedRow, requestId, appliedStatus }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // issue
    if (!isAllowedIssueStatus(payload.status)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid issue status", requestId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updates: Record<string, unknown> = { status: payload.status };
    if (payload.assigned_to !== undefined) updates.assigned_to = payload.assigned_to;

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

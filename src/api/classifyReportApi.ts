// classify-report.ts (Supabase Edge Function)
import { serve } from "https://deno.land/std@0.193.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- TYPES ---
export type ReportType = "building" | "issue";

export type BuildingStatus = "pending" | "critical" | "under_maintenance" | "resolved";
export type IssueStatus = "pending" | "under_review" | "under_maintenance" | "resolved";

export interface ClassifyReportResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// --- VALIDATION HELPERS ---
function isAllowedBuildingStatus(s: string): s is BuildingStatus {
  return ["pending", "critical", "under_maintenance", "resolved"].includes(s);
}

function isAllowedIssueStatus(s: string): s is IssueStatus {
  return ["pending", "under_review", "under_maintenance", "resolved"].includes(s);
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// --- SUPABASE ADMIN CLIENT (service role bypasses RLS) ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// --- EDGE FUNCTION ---
serve(async (req) => {
  try {
    const body = (await req.json()) as {
      type: ReportType;
      id: string | number;
      status: BuildingStatus | IssueStatus;
      assigned_to?: string | null;
    };

    const { type, id, status, assigned_to = null } = body;

    if (!type || !id || !status) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let updateResult;

    if (type === "issue") {
      // Validate issue ID + status
      if (isNaN(Number(id)) || Number(id) <= 0) {
        return new Response(JSON.stringify({ success: false, error: "Issue ID must be a positive number" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!isAllowedIssueStatus(status)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid issue status" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      updateResult = await supabaseAdmin
        .from("issues")
        .update({ status, assigned_to })
        .eq("id", Number(id))
        .select("*")
        .single();
    } else if (type === "building") {
      // Validate building ID + status
      if (!isValidUUID(String(id))) {
        return new Response(JSON.stringify({ success: false, error: "Building ID must be a UUID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!isAllowedBuildingStatus(status)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid building status" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      updateResult = await supabaseAdmin
        .from("buildings_at_risk")
        .update({ status, assigned_to })
        .eq("id", String(id))
        .select("*")
        .single();
    } else {
      return new Response(JSON.stringify({ success: false, error: "Invalid report type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (updateResult.error) {
      return new Response(JSON.stringify({ success: false, error: updateResult.error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: updateResult.data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[classify-report] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

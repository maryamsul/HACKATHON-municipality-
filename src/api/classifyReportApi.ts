// classify-report.ts (Supabase Edge Function + wrappers)
import { serve } from "https://deno.land/std@0.193.0/http/server.ts";
import { supabase } from "@/integrations/supabase/client";
import { BuildingStatus } from "@/types/building";
import { IssueStatus } from "@/types/issue";

export type ReportType = "building" | "issue";

export interface ClassifyReportResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/** --- EDGE FUNCTION --- */
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
      updateResult = await supabase.from("issues").update({ status, assigned_to }).eq("id", Number(id));
    } else if (type === "building") {
      updateResult = await supabase.from("buildings_at_risk").update({ status, assigned_to }).eq("id", String(id));
    } else {
      return new Response(JSON.stringify({ success: false, error: "Invalid type" }), {
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

/** --- WRAPPER FUNCTIONS --- */
export async function updateReportStatus(
  type: ReportType,
  id: string | number,
  status: BuildingStatus | IssueStatus,
  assigned_to: string | null = null,
): Promise<ClassifyReportResponse> {
  try {
    const res = await fetch(`${supabase.functionsUrl}/classify-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, status, assigned_to }),
    });
    const result = await res.json();
    return result as ClassifyReportResponse;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

export async function updateBuildingStatus(
  buildingId: string,
  status: BuildingStatus,
  assigned_to: string | null = null,
) {
  return updateReportStatus("building", buildingId, status, assigned_to);
}

export async function updateIssueStatus(issueId: number, status: IssueStatus, assigned_to: string | null = null) {
  return updateReportStatus("issue", issueId, status, assigned_to);
}

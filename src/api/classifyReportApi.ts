// Classify Report API - Updates building or issue status via Edge Function
import { supabase } from "@/integrations/supabase/client";
import { BuildingStatus } from "@/types/building";
import { IssueStatus } from "@/types/issue";

const SUPABASE_URL = "https://ypgoodjdxcnjysrsortp.supabase.co";
const CLASSIFY_REPORT_URL = `${SUPABASE_URL}/functions/v1/classify-report`;

export type ReportType = "building" | "issue";

export interface ClassifyReportPayload {
  type: ReportType;
  id: string | number;
  status: BuildingStatus | IssueStatus;
  assigned_to?: string | null;
}

export interface ClassifyReportResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  details?: string;
  requestId?: string;
}

/**
 * Update a building or issue status via Supabase Edge Function
 *
 * @param type "building" | "issue"
 * @param id row ID (UUID string for buildings, number for issues)
 * @param status must match DB enum:
 *               Buildings: pending, critical, under_maintenance, resolved
 *               Issues: pending, under_review, under_maintenance, resolved
 * @param assigned_to optional UUID of assigned user
 * @returns Promise with the API response
 * @throws Error if user is not authenticated or update fails
 */
export async function updateReportStatus(
  type: ReportType,
  id: string | number,
  status: BuildingStatus | IssueStatus,
  assigned_to: string | null = null,
): Promise<ClassifyReportResponse> {
  // Get current session for auth token
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    console.error("[classifyReportApi] No active session:", sessionError);
    throw new Error("You must be logged in to update status");
  }

  const token = sessionData.session.access_token;

  // Validate and normalize ID based on type
  let normalizedId: string | number;
  if (type === "building") {
    // Buildings use UUID strings - ensure it's a string
    normalizedId = String(id);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(normalizedId)) {
      console.error(`[classifyReportApi] Invalid building UUID: ${normalizedId}`);
      throw new Error(`Invalid building ID: ${normalizedId}. Must be a UUID.`);
    }
  } else {
    // Issues use numeric IDs - ensure it's a number
    normalizedId = typeof id === "number" ? id : parseInt(String(id), 10);
    if (isNaN(normalizedId) || normalizedId <= 0) {
      console.error(`[classifyReportApi] Invalid issue ID: ${id}`);
      throw new Error(`Invalid issue ID: ${id}. Must be a positive number.`);
    }
  }

  // Validate status based on type
  const validBuildingStatuses: BuildingStatus[] = ["pending", "critical", "under_maintenance", "resolved"];
  const validIssueStatuses: IssueStatus[] = ["pending", "under_review", "under_maintenance", "resolved"];

  if (type === "building" && !validBuildingStatuses.includes(status as BuildingStatus)) {
    throw new Error(`Invalid building status: ${status}. Must be one of: ${validBuildingStatuses.join(", ")}`);
  }

  if (type === "issue" && !validIssueStatuses.includes(status as IssueStatus)) {
    throw new Error(`Invalid issue status: ${status}. Must be one of: ${validIssueStatuses.join(", ")}`);
  }

  // Log payload before sending
  console.log(`[classifyReportApi] === SENDING PAYLOAD ===`);
  console.log(`[classifyReportApi] type: ${type}`);
  console.log(`[classifyReportApi] id: ${normalizedId} (typeof: ${typeof normalizedId})`);
  console.log(`[classifyReportApi] status: ${status}`);
  console.log(`[classifyReportApi] assigned_to: ${assigned_to}`);

  try {
    const payload = {
      type,
      id: normalizedId,
      status,
      assigned_to,
    };

    const res = await fetch(CLASSIFY_REPORT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      console.error("[classifyReportApi] Update failed:", result);
      return {
        success: false,
        error: result.error || "Failed to update status",
        details: result.details,
        requestId: result.requestId,
      };
    }

    console.log("[classifyReportApi] Update successful:", result);
    return {
      success: true,
      data: result.data,
      requestId: result.requestId,
    };
  } catch (error) {
    console.error("[classifyReportApi] Network error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
      details: "Unable to reach the server. Please check your connection.",
    };
  }
}

/**
 * Update building status - convenience wrapper
 */
export async function updateBuildingStatus(
  buildingId: string,
  status: BuildingStatus,
  assigned_to: string | null = null,
): Promise<ClassifyReportResponse> {
  return updateReportStatus("building", buildingId, status, assigned_to);
}

/**
 * Update issue status - convenience wrapper
 */
export async function updateIssueStatus(
  issueId: number,
  status: IssueStatus,
  assigned_to: string | null = null,
): Promise<ClassifyReportResponse> {
  return updateReportStatus("issue", issueId, status, assigned_to);
}

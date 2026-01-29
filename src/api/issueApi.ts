// Issue API - Uses Supabase edge functions for secure API calls
import { supabase } from "@/integrations/supabase/client";

export interface IssueReportData {
  title: string;
  description: string;
  category: string;
  latitude?: number | null;
  longitude?: number | null;
  thumbnail?: string | null;
}

export interface IssueApiResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string;
  details?: string;
}

// Input validation helpers
const sanitizeString = (input: string, maxLength: number = 500): string => {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLength);
};

const validateCoordinate = (
  coord: number | null | undefined,
  min: number,
  max: number
): number | null => {
  if (coord === null || coord === undefined) return null;
  if (typeof coord !== "number" || !isFinite(coord)) return null;
  if (coord < min || coord > max) return null;
  return coord;
};

/**
 * Creates a new issue report via the edge function.
 * The edge function uses service role to bypass RLS.
 */
export const createIssueReport = async (
  reportData: IssueReportData
): Promise<IssueApiResponse> => {
  try {
    // Validate and sanitize inputs
    const title = sanitizeString(reportData.title, 200);
    const description = sanitizeString(reportData.description, 2000);
    const category = sanitizeString(reportData.category, 100);

    if (!title || !description || !category) {
      return {
        success: false,
        error: "Missing required fields",
        details: "Title, description, and category are required",
      };
    }

    console.log("Calling create-issue API via Supabase client");

    const { data, error } = await supabase.functions.invoke("create-issue", {
      body: {
        title,
        description,
        category,
        latitude: validateCoordinate(reportData.latitude, -90, 90),
        longitude: validateCoordinate(reportData.longitude, -180, 180),
        thumbnail: reportData.thumbnail
          ? sanitizeString(reportData.thumbnail, 500)
          : null,
      },
    });

    if (error) {
      console.error("Edge function error:", error);
      return {
        success: false,
        error: error.message || "Failed to create issue",
        details: "Edge function invocation failed",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || "Failed to create issue",
        details: data?.details || "Unknown error",
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.error("Error calling issue API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
      details:
        "Unable to reach the server. Please check your connection and try again.",
    };
  }
};

/**
 * Updates the status of an existing issue via the classify-report edge function.
 * Only employees can update issue status.
 */
export const updateIssueStatus = async (
  issueId: number,
  newStatus: string,
  assignedTo?: string | null
): Promise<IssueApiResponse> => {
  try {
    if (!Number.isFinite(issueId) || issueId <= 0) {
      return {
        success: false,
        error: "Invalid issue ID",
      };
    }

    console.log("Calling classify-report API for issue status update");

    const { data, error } = await supabase.functions.invoke("classify-report", {
      body: {
        type: "issue",
        id: issueId,
        status: newStatus,
        assigned_to: assignedTo,
      },
    });

    if (error) {
      console.error("Edge function error:", error);
      return {
        success: false,
        error: error.message || "Failed to update issue",
        details: "Edge function invocation failed",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || "Failed to update issue",
        details: data?.details || "Unknown error",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    console.error("Unexpected error in updateIssueStatus:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

/**
 * Dismisses an issue via the classify-report edge function.
 * Only employees can dismiss issues. Idempotent - returns success even if already dismissed.
 */
export const dismissIssue = async (
  issueId: number
): Promise<IssueApiResponse> => {
  try {
    if (!Number.isFinite(issueId) || issueId <= 0) {
      return {
        success: false,
        error: "Invalid issue ID",
      };
    }

    console.log("[issueApi] Calling classify-report for dismiss, issueId:", issueId);

    // Use classify-report with action: "dismiss" for soft delete
    const { data, error } = await supabase.functions.invoke("classify-report", {
      body: {
        type: "issue",
        id: issueId,
        action: "dismiss",
      },
    });

    if (error) {
      console.error("[issueApi] Dismiss invoke error:", error);
      return {
        success: false,
        error: error.message || "Failed to dismiss issue",
        details: "Edge function invocation failed",
      };
    }

    // Always check response success field
    if (!data?.success) {
      return {
        success: false,
        error: data?.error || "Failed to dismiss issue",
        details: data?.details || "Unknown error",
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (err) {
    console.error("[issueApi] dismissIssue exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

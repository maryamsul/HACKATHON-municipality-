// Building at Risk API - Uses Supabase client for secure API calls
import { supabase } from "@/integrations/supabase/client";

export interface BuildingReportData {
  title: string;
  description: string;
  reportedBy: string;
  assignedTo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  thumbnail?: string | null;
}

export interface BuildingApiResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string;
  details?: string;
}

// Input validation helpers
const sanitizeString = (input: string, maxLength: number = 500): string => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
};

const validateCoordinate = (coord: number | null | undefined): number | null => {
  if (coord === null || coord === undefined) return null;
  if (typeof coord !== 'number' || !isFinite(coord)) return null;
  return coord;
};

/**
 * Creates a new building at risk report via the edge function.
 * The edge function uses service role to bypass RLS.
 */
export const createBuildingReport = async (reportData: BuildingReportData): Promise<BuildingApiResponse> => {
  try {
    // Validate and sanitize inputs
    const title = sanitizeString(reportData.title, 200);
    const description = sanitizeString(reportData.description, 2000);
    const reportedBy = sanitizeString(reportData.reportedBy, 100);
    
    if (!title || !description || !reportedBy) {
      return {
        success: false,
        error: "Missing required fields",
        details: "Title, description, and reportedBy are required",
      };
    }

    console.log("Calling building report API via Supabase client");

    const { data, error } = await supabase.functions.invoke("quick-endpoint", {
      body: {
        title,
        description,
        reportedBy,
        assignedTo: reportData.assignedTo || null,
        latitude: validateCoordinate(reportData.latitude),
        longitude: validateCoordinate(reportData.longitude),
        thumbnail: reportData.thumbnail ? sanitizeString(reportData.thumbnail, 500) : null,
      },
    });

    if (error) {
      console.error("Edge function error:", error);
      return {
        success: false,
        error: error.message || "Failed to create building report",
        details: "Edge function invocation failed",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || "Failed to create building report",
        details: data?.details || "Unknown error",
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.error("Error calling building report API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
      details: "Unable to reach the server. Please check your connection and try again.",
    };
  }
};

/**
 * Updates the status of an existing building report via direct Supabase call.
 */
export const updateBuildingStatus = async (
  buildingId: string,
  newStatus: "pending" | "under_inspection" | "resolved",
): Promise<BuildingApiResponse> => {
  try {
    // Validate buildingId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(buildingId)) {
      return {
        success: false,
        error: "Invalid building ID format",
      };
    }

    const { data, error } = await supabase
      .from("buildings_at_risk")
      .update({ status: newStatus })
      .eq("id", buildingId)
      .select()
      .single();

    if (error) {
      console.error("Error updating building status:", error);
      return {
        success: false,
        error: error.message,
        details: error.details || error.hint,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Unexpected error in updateBuildingStatus:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

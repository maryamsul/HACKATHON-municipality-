// Supabase configuration - same as Issues API
const SUPABASE_URL = "https://ypgoodjdxcnjysrsortp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rs58HjDUbtkp9QvD7Li4VA_fqtAUF2u";
const API_URL = `${SUPABASE_URL}/functions/v1/building-at-risk`;

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

/**
 * Creates a new building at risk report via the edge function.
 * The edge function uses service role to bypass RLS.
 * Maps form fields to public.buildings_at_risk table columns:
 * - title → title
 * - description → description
 * - reportedBy → reported_by
 * - assignedTo → assigned_to (optional)
 * - latitude → latitude (optional)
 * - longitude → longitude (optional)
 * - thumbnail → thumbnail (optional)
 * - status → default 'pending'
 */
export const createBuildingReport = async (reportData: BuildingReportData): Promise<BuildingApiResponse> => {
  try {
    console.log("Calling building report API:", reportData);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        title: reportData.title,
        description: reportData.description,
        reportedBy: reportData.reportedBy,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        thumbnail: reportData.thumbnail,
      }),
    });

    const result = await response.json();
    console.log("API response:", result);

    // Check if the response indicates success
    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || "Failed to create building report",
        details: result.details || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error) {
    console.error("Error calling building report API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
      details: "Unable to reach the server. Please try again.",
    };
  }
};

/**
 * Updates the status of an existing building report via direct Supabase call.
 * Note: This requires appropriate RLS policies or should be converted to edge function.
 */
export const updateBuildingStatus = async (
  buildingId: string,
  newStatus: "pending" | "under_inspection" | "resolved",
): Promise<BuildingApiResponse> => {
  try {
    // Import supabase client dynamically to avoid circular dependencies
    const { supabase } = await import("@/integrations/supabase/client");

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

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
  error?: string;
  details?: string;
}

/**
 * Creates a new building at risk report in the database.
 * Maps form fields to public.buildings_at_risk table columns.
 */
export const createBuildingReport = async (
  reportData: BuildingReportData
): Promise<BuildingApiResponse> => {
  try {
    // Validate required fields
    if (!reportData.title?.trim()) {
      return {
        success: false,
        error: "Title is required",
        details: "The building name/title field cannot be empty",
      };
    }

    if (!reportData.description?.trim()) {
      return {
        success: false,
        error: "Description is required",
        details: "Please provide a description of the building risk",
      };
    }

    if (!reportData.reportedBy) {
      return {
        success: false,
        error: "Reporter ID is required",
        details: "User must be authenticated to submit a report",
      };
    }

    // Map form fields to database columns
    const insertData = {
      title: reportData.title.trim(),
      description: reportData.description.trim(),
      reported_by: reportData.reportedBy,
      assigned_to: reportData.assignedTo || null,
      status: "pending" as const,
      latitude: reportData.latitude ?? null,
      longitude: reportData.longitude ?? null,
      thumbnail: reportData.thumbnail || null,
    };

    console.log("Inserting building report:", insertData);

    // Insert into public.buildings_at_risk table
    const { data, error } = await supabase
      .from("buildings_at_risk")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Database error creating building report:", error);
      
      // Parse Postgres/PostgREST error for descriptive message
      const errorMessage = error.message || "Database insertion failed";
      const errorDetails = [
        error.details,
        error.hint,
        error.code ? `Code: ${error.code}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      return {
        success: false,
        error: errorMessage,
        details: errorDetails || "Check database constraints and RLS policies",
      };
    }

    console.log("Building report created successfully:", data);

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Unexpected error in createBuildingReport:", err);
    
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
      details: "An unexpected error occurred while creating the report",
    };
  }
};

/**
 * Updates the status of an existing building report.
 * Only employees should be able to call this.
 */
export const updateBuildingStatus = async (
  buildingId: string,
  newStatus: "pending" | "under_inspection" | "resolved"
): Promise<BuildingApiResponse> => {
  try {
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

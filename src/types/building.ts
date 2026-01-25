// Building at risk status enum values - aligned with Issues for consistency
export type BuildingStatus = "under_review" | "under_maintenance" | "resolved";

export const BUILDING_STATUSES: Record<BuildingStatus, { label: string; color: string }> = {
  under_review: { label: "Critical", color: "bg-red-100 text-red-700" },
  under_maintenance: { label: "Under Inspection", color: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
};

// BuildingAtRisk now matches the same structure as issues table
export interface BuildingAtRisk {
  id: string;
  title: string;
  description: string;
  reported_by: string;
  assigned_to: string | null;
  status: BuildingStatus;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  thumbnail: string | null;
  // Derived field for UI compatibility
  building_name?: string;
}

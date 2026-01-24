// Building at risk status enum values - matches database
export type BuildingStatus = "pending" | "under_inspection" | "resolved";

export const BUILDING_STATUSES: Record<BuildingStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  under_inspection: { label: "Under Inspection", color: "bg-blue-100 text-blue-700" },
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

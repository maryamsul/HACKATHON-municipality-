// Building at risk status enum values
// "pending" = new report awaiting employee classification
// "critical", "under_maintenance", "resolved" = employee-classified statuses
export type BuildingStatus = "pending" | "critical" | "under_maintenance" | "resolved";

export const BUILDING_STATUSES: Record<BuildingStatus, { label: string }> = {
  pending: { label: "Pending" },
  critical: { label: "Critical" },
  under_maintenance: { label: "Under Maintenance" },
  resolved: { label: "Resolved" },
};

// BuildingAtRisk matches the buildings_at_risk table structure
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

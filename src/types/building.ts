// Building at risk status enum values - EXACT match to database constraint
// pending = new report awaiting employee classification
// critical = employee-classified as critical/dangerous
// under_maintenance = building is being repaired/inspected
// resolved = issue has been resolved
export type BuildingStatus = "pending" | "critical" | "under_maintenance" | "resolved";

// Status labels for UI display - keys match database values exactly
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

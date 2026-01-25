// Building at risk status enum values - EXACT match to database constraint
// pending = new report awaiting employee classification
// Critical = employee-classified as critical/dangerous
// Under Inspection = building is being inspected
// Resolved = issue has been resolved
export type BuildingStatus = "pending" | "Critical" | "Under Inspection" | "Resolved";

// Status labels for UI display - keys match database values exactly
export const BUILDING_STATUSES: Record<BuildingStatus, { label: string }> = {
  pending: { label: "Pending" },
  Critical: { label: "Critical" },
  "Under Inspection": { label: "Under Inspection" },
  Resolved: { label: "Resolved" },
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

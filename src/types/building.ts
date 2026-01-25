// Building at risk status enum values (must match the Buildings-at-Risk UI requirements)
// NOTE: The database may still contain legacy values (e.g. pending/under_review/etc.).
// Those are normalized in BuildingsContext.
export type BuildingStatus = "critical" | "under_maintenance" | "resolved";

export const BUILDING_STATUSES: Record<BuildingStatus, { label: string }> = {
  critical: { label: "Critical" },
  under_maintenance: { label: "Under Maintenance" },
  resolved: { label: "Resolved" },
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

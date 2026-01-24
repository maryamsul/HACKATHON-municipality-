// Building at risk status enum values - matches database
export type BuildingStatus = "pending" | "under_inspection" | "resolved";

export const BUILDING_STATUSES: Record<BuildingStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  under_inspection: { label: "Under Inspection", color: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
};

export type ReporterType = "citizen" | "employee";

export interface BuildingAtRisk {
  id: string;
  building_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  reported_by: string;
  reporter_type: ReporterType;
  status: BuildingStatus;
  description: string;
  created_at: string;
  updated_at?: string;
}

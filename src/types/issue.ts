// Issue status enum values - matches database
export type IssueStatus = "under_review" | "under_maintenance" | "resolved";

export const ISSUE_STATUSES: Record<IssueStatus, { label: string; color: string }> = {
  under_review: { label: "Under Review", color: "bg-orange-100 text-orange-700" },
  under_maintenance: { label: "Under Maintenance", color: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
};

export interface StatusHistory {
  status: IssueStatus;
  date: string;
  note?: string;
}

export interface Issue {
  id: number;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  status: IssueStatus;
  description: string;
  reported_by: string;
  assigned_to?: string;
  created_at: string;
  thumbnail?: string;
}

// Issue status enum values - EXACT match to database constraint
// Under Review = report is being reviewed
// Under Maintenance = issue is being fixed
// Resolved = issue has been resolved
export type IssueStatus = "Under Review" | "Under Maintenance" | "Resolved";

export const ISSUE_STATUSES: Record<IssueStatus, { label: string; color: string }> = {
  "Under Review": { label: "Under Review", color: "bg-orange-100 text-orange-700" },
  "Under Maintenance": { label: "Under Maintenance", color: "bg-blue-100 text-blue-700" },
  Resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
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

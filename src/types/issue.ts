export interface StatusHistory {
  status: "pending" | "in-progress" | "resolved";
  date: string;
  note?: string;
}

export interface Issue {
  id: number;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  status: "pending" | "in-progress" | "resolved";
  description: string;
  reported_by: string;
  assigned_to?: string;
  created_at: string;
  thumbnail?: string;
}

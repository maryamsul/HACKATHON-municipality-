export interface StatusHistory {
  status: "pending" | "in-progress" | "resolved";
  date: string;
  note?: string;
}

export interface Issue {
  id: string;
  category: string;
  thumbnail: string;
  location: string;
  coordinates: { lat: number; lng: number };
  status: "pending" | "in-progress" | "resolved";
  date: string;
  description: string;
  statusHistory: StatusHistory[];
}

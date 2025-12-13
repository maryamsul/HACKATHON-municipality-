import { Issue } from "@/types/issue";

export const mockIssues: Issue[] = [
  {
    id: "1",
    category: "Pothole",
    thumbnail: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=200&h=200&fit=crop",
    location: "123 Main Street, Downtown",
    coordinates: { lat: 40.7128, lng: -74.006 },
    status: "pending",
    date: "2024-12-10",
    description: "Large pothole approximately 2 feet wide causing traffic hazard. Multiple vehicles have reported damage.",
    statusHistory: [
      { status: "pending", date: "2024-12-10", note: "Issue reported by citizen" }
    ]
  },
  {
    id: "2",
    category: "Pothole",
    thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
    location: "456 Oak Avenue, Westside",
    coordinates: { lat: 40.7589, lng: -73.9851 },
    status: "in-progress",
    date: "2024-12-08",
    description: "Medium-sized pothole near school crossing. Priority repair needed.",
    statusHistory: [
      { status: "pending", date: "2024-12-08", note: "Issue reported" },
      { status: "in-progress", date: "2024-12-11", note: "Repair crew assigned" }
    ]
  },
  {
    id: "3",
    category: "Pothole",
    thumbnail: "https://images.unsplash.com/photo-1567789884554-0b844b597180?w=200&h=200&fit=crop",
    location: "789 Park Road, Eastside",
    coordinates: { lat: 40.7484, lng: -73.9857 },
    status: "resolved",
    date: "2024-12-05",
    description: "Small pothole on residential street. Repaired successfully.",
    statusHistory: [
      { status: "pending", date: "2024-12-05", note: "Issue reported" },
      { status: "in-progress", date: "2024-12-07", note: "Scheduled for repair" },
      { status: "resolved", date: "2024-12-09", note: "Repair completed" }
    ]
  },
  {
    id: "4",
    category: "Garbage",
    thumbnail: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=200&h=200&fit=crop",
    location: "321 Elm Street, Northside",
    coordinates: { lat: 40.7614, lng: -73.9776 },
    status: "pending",
    date: "2024-12-12",
    description: "Overflowing trash bins near park entrance. Attracting pests.",
    statusHistory: [
      { status: "pending", date: "2024-12-12", note: "Issue reported by park visitor" }
    ]
  },
  {
    id: "5",
    category: "Garbage",
    thumbnail: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=200&h=200&fit=crop",
    location: "654 Pine Lane, Southside",
    coordinates: { lat: 40.7282, lng: -73.7949 },
    status: "in-progress",
    date: "2024-12-09",
    description: "Illegal dumping site discovered behind commercial building.",
    statusHistory: [
      { status: "pending", date: "2024-12-09", note: "Issue reported" },
      { status: "in-progress", date: "2024-12-11", note: "Cleanup crew dispatched" }
    ]
  },
  {
    id: "6",
    category: "Water Leak",
    thumbnail: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200&h=200&fit=crop",
    location: "987 River Road, Waterfront",
    coordinates: { lat: 40.7061, lng: -74.0088 },
    status: "pending",
    date: "2024-12-11",
    description: "Water main leak causing flooding on street. Urgent attention required.",
    statusHistory: [
      { status: "pending", date: "2024-12-11", note: "Emergency reported" }
    ]
  },
  {
    id: "7",
    category: "Water Leak",
    thumbnail: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=200&h=200&fit=crop",
    location: "246 Creek Avenue, Hillside",
    coordinates: { lat: 40.7831, lng: -73.9712 },
    status: "resolved",
    date: "2024-12-03",
    description: "Fire hydrant leak fixed after emergency repair.",
    statusHistory: [
      { status: "pending", date: "2024-12-03", note: "Leak reported" },
      { status: "in-progress", date: "2024-12-03", note: "Emergency crew on site" },
      { status: "resolved", date: "2024-12-04", note: "Hydrant repaired" }
    ]
  },
  {
    id: "8",
    category: "Lighting",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
    location: "135 Sunset Boulevard, Central",
    coordinates: { lat: 40.7580, lng: -73.9855 },
    status: "pending",
    date: "2024-12-10",
    description: "Street light outage creating safety concern at intersection.",
    statusHistory: [
      { status: "pending", date: "2024-12-10", note: "Reported by neighborhood watch" }
    ]
  },
  {
    id: "9",
    category: "Traffic",
    thumbnail: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=200&h=200&fit=crop",
    location: "567 Highway Junction, Industrial",
    coordinates: { lat: 40.7527, lng: -73.9772 },
    status: "in-progress",
    date: "2024-12-07",
    description: "Traffic signal malfunction causing delays during rush hour.",
    statusHistory: [
      { status: "pending", date: "2024-12-07", note: "Issue reported" },
      { status: "in-progress", date: "2024-12-09", note: "Technician assigned" }
    ]
  },
  {
    id: "10",
    category: "Other",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
    location: "890 Community Center, Plaza",
    coordinates: { lat: 40.7489, lng: -73.9680 },
    status: "resolved",
    date: "2024-12-01",
    description: "Damaged park bench replaced with new seating.",
    statusHistory: [
      { status: "pending", date: "2024-12-01", note: "Damage reported" },
      { status: "in-progress", date: "2024-12-04", note: "New bench ordered" },
      { status: "resolved", date: "2024-12-08", note: "Installation complete" }
    ]
  }
];

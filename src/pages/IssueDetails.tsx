import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { useIssues } from "@/context/IssuesContext";
import BottomNav from "@/components/BottomNav";

const statusStyles = {
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
};

const statusLabels = {
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

const categoryIcons: Record<string, string> = {
  Pothole: "🕳️",
  Garbage: "🗑️",
  "Water Leak": "💧",
  Lighting: "💡",
  Traffic: "🚦",
  Other: "📋",
};

const IssueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { issues, loading } = useIssues();

  const issue = issues.find((i) => i.id === Number(id));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Issue not found</p>
      </div>
    );
  }

  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+ef4444(${issue.longitude},${issue.latitude})/${issue.longitude},${issue.latitude},14,0/400x200@2x?access_token=pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNtN2Z6bHE3ZzBnMHIycXM2NTY4NnRtNnkifQ.bMDOJwKDJqllBIYc0MbhfA`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background pb-24">
      {/* Header with Icon */}
      <div className="relative bg-gradient-to-br from-primary/20 to-primary/10">
        <div className="h-64 flex items-center justify-center">
          <span className="text-8xl">{categoryIcons[issue.category] || "📋"}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-6 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="absolute bottom-4 left-6 right-6">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusStyles[issue.status]}`}>
            {statusLabels[issue.status]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Title & Meta */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-3">{issue.title}</h1>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Reported on {new Date(issue.created_at).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
          <p className="text-muted-foreground leading-relaxed">{issue.description}</p>
        </div>

        {/* Static Map */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Location</h2>
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <img
              src={staticMapUrl}
              alt="Issue location map"
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://via.placeholder.com/400x200/e5e7eb/9ca3af?text=Map+Location`;
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Coordinates: {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default IssueDetails;

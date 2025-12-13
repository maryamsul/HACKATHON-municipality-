import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Clock } from "lucide-react";
import { useIssues } from "@/context/IssuesContext";
import BottomNav from "@/components/BottomNav";

const statusStyles = {
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
};

const statusDotStyles = {
  pending: "bg-orange-500",
  "in-progress": "bg-blue-500",
  resolved: "bg-green-500",
};

const statusLabels = {
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

const IssueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { issues } = useIssues();

  const issue = issues.find((i) => i.id === id);

  if (!issue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Issue not found</p>
      </div>
    );
  }

  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+ef4444(${issue.coordinates.lng},${issue.coordinates.lat})/${issue.coordinates.lng},${issue.coordinates.lat},14,0/400x200@2x?access_token=pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNtN2Z6bHE3ZzBnMHIycXM2NTY4NnRtNnkifQ.bMDOJwKDJqllBIYc0MbhfA`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background pb-24">
      {/* Header with Image */}
      <div className="relative">
        <img
          src={issue.thumbnail.replace("w=200&h=200", "w=800&h=400")}
          alt={issue.category}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
          <h1 className="text-2xl font-bold text-foreground mb-3">{issue.category} Issue</h1>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{issue.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Reported on {new Date(issue.date).toLocaleDateString('en-US', { 
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
            Coordinates: {issue.coordinates.lat.toFixed(4)}, {issue.coordinates.lng.toFixed(4)}
          </p>
        </div>

        {/* Status History */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Status History</h2>
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
            
            <div className="space-y-4">
              {issue.statusHistory.map((history, index) => (
                <div key={index} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-background ${statusDotStyles[history.status]}`} />
                  
                  <div className="bg-card rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[history.status]}`}>
                        {statusLabels[history.status]}
                      </span>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(history.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {history.note && (
                      <p className="text-sm text-muted-foreground mt-2">{history.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default IssueDetails;

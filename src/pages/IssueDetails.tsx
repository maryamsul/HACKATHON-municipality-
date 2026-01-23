import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { useIssues } from "@/context/IssuesContext";
import { useAuth } from "@/context/AuthContext";
import { ISSUE_STATUSES, IssueStatus } from "@/types/issue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

const categoryIcons: Record<string, string> = {
  "Roads & Infrastructure": "🛣️",
  "Water & Sewage": "💧",
  Electricity: "⚡",
  "Waste Management": "🗑️",
  "Public Safety": "🚨",
  "Parks & Recreation": "🌳",
  Other: "📋",
};

const IssueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { issues, loading, refetchIssues } = useIssues();
  const { profile } = useAuth();
  const { toast } = useToast();
  const isEmployee = profile?.role === "employee";

  const issue = issues.find((i) => i.id === Number(id));

  const handleStatusChange = async (newStatus: string) => {
    if (!issue) return;
    try {
      const { error } = await supabase
        .from("issues")
        .update({ status: newStatus })
        .eq("id", issue.id);
      
      if (error) throw error;
      
      await refetchIssues();
      toast({ 
        title: "Status updated", 
        description: `Issue marked as ${ISSUE_STATUSES[newStatus as IssueStatus]?.label || newStatus}` 
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

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

  const currentStatus = ISSUE_STATUSES[issue.status as IssueStatus] || ISSUE_STATUSES.under_review;
  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${issue.longitude - 0.01},${issue.latitude - 0.01},${issue.longitude + 0.01},${issue.latitude + 0.01}&layer=mapnik&marker=${issue.latitude},${issue.longitude}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background pb-24">
      {/* Header with Category Image */}
      <div className="relative bg-gradient-to-br from-primary/20 to-primary/10">
        <div className="h-64 flex items-center justify-center">
          {issue.thumbnail ? (
            <img src={issue.thumbnail} alt={issue.category} className="h-full w-full object-cover" />
          ) : (
            <span className="text-8xl">{categoryIcons[issue.category] || "📋"}</span>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-6 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>

        <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
          {isEmployee ? (
            <Select value={issue.status} onValueChange={handleStatusChange}>
              <SelectTrigger className={`w-44 h-9 text-sm font-medium border-0 ${currentStatus.color}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          )}
          {isEmployee && (
            <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
              Employee View
            </span>
          )}
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
              <span className="text-sm text-gray-800">
                {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm text-gray-800">
                Reported on{" "}
                {new Date(issue.created_at).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
          <p className="text-muted-foreground leading-relaxed text-gray-800">{issue.description}</p>
        </div>

        {/* Map with Google Maps Link */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Location</h2>
          <div className="rounded-2xl overflow-hidden shadow-sm border border-border">
            <iframe src={openStreetMapUrl} className="w-full h-48 border-0" title="Issue location map" />
          </div>
          <a
            href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary mt-2 underline inline-block"
          >
            Open in Google Maps →
          </a>
          <p className="text-sm text-muted-foreground mt-1">
            Coordinates: {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default IssueDetails;

import { Issue, ISSUE_STATUSES, IssueStatus } from "@/types/issue";
import { MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIssues } from "@/context/IssuesContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { updateIssueStatus } from "@/api/issueApi";

interface IssueCardProps {
  issue: Issue;
  index?: number;
}

const categoryIcons: Record<string, string> = {
  Pothole: "🕳️",
  Garbage: "🗑️",
  "Water Leak": "💧",
  Lighting: "💡",
  Traffic: "🚦",
  Other: "📋",
};

const IssueCard = ({ issue, index = 0 }: IssueCardProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { updateIssueOptimistic, refetchIssues } = useIssues();
  const { toast } = useToast();
  const isEmployee = profile?.role === "employee";

  // LOCAL STATE FOR UI RESPONSIVENESS
  const [localStatus, setLocalStatus] = useState<IssueStatus>(issue.status as IssueStatus);

  // KEEP LOCAL STATE IN SYNC IF EXTERNAL DATA UPDATES
  useEffect(() => {
    setLocalStatus(issue.status as IssueStatus);
  }, [issue.status]);

  const formatLocation = (lat: number | null, lng: number | null) => {
    if (lat === null || lng === null) return t('common.coordinates') + ': N/A';
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("status.pendingNew");
      case "pending_approved":
        return t("status.pending");
      case "under_review":
        return t("status.underReview");
      case "under_maintenance":
        return t("status.underInspection", "Under Inspection");
      case "resolved":
        return t("status.resolved");
      default:
        return status;
    }
  };

  const currentStatus = ISSUE_STATUSES[localStatus] || ISSUE_STATUSES.under_review;

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (newStatus === localStatus) return;

    const issueId = typeof issue.id === "number" ? issue.id : parseInt(String(issue.id), 10);

    if (isNaN(issueId) || issueId <= 0) {
      toast({
        title: t("common.error"),
        description: "Invalid issue ID",
        variant: "destructive",
      });
      return;
    }

    // 1. OPTIMISTIC UPDATE
    setLocalStatus(newStatus);
    updateIssueOptimistic(issueId, {
      status: newStatus,
      assigned_to: undefined,
    });

    try {
      const result = await updateIssueStatus(issueId, newStatus, null);

      console.log("[IssueCard] API response:", JSON.stringify(result));

      if (result.success) {
        toast({
          title: t("issueDetails.statusUpdated"),
          description: `${t("issueDetails.issueMarkedAs")} ${getStatusLabel(newStatus)}`,
        });
        refetchIssues().catch(err => console.log("[IssueCard] Background refetch error:", err));
      } else {
        console.error("[IssueCard] API returned failure:", result);
        setLocalStatus(issue.status as IssueStatus);
        toast({
          title: t("common.error"),
          description: result.error || t("issueDetails.failedToUpdateStatus"),
          variant: "destructive",
        });
        refetchIssues().catch(err => console.log("[IssueCard] Revert refetch error:", err));
      }
    } catch (err: unknown) {
      console.error("Status Update Failed:", err);
      setLocalStatus(issue.status as IssueStatus);
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: t("common.error"),
        description: message || t("issueDetails.failedToUpdateStatus"),
        variant: "destructive",
      });
    }
  };

  // Hide pending issues from IssueCard - they should only appear in Alerts page
  if (localStatus === "pending") {
    return null;
  }

  return (
    <motion.div
      className="w-full flex gap-4 p-4 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <motion.button
        onClick={() => navigate(`/issue/${issue.id}`)}
        className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center text-3xl overflow-hidden"
      >
        {issue.thumbnail ? (
          <img src={issue.thumbnail} alt={issue.category} className="w-full h-full object-cover" />
        ) : (
          categoryIcons[issue.category] || "📋"
        )}
      </motion.button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/issue/${issue.id}`)}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold truncate pr-2">{issue.title || issue.category}</h3>

          {isEmployee ? (
            // Employees see status dropdown (no dismiss here - only in Alerts page)
            <div onClick={(e) => e.stopPropagation()}>
              <Select value={localStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className={`w-36 h-7 text-xs border-0 rounded-full font-medium ${currentStatus.color}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_approved">{t("status.pending")}</SelectItem>
                  <SelectItem value="under_review">{t("status.underReview")}</SelectItem>
                  <SelectItem value="under_maintenance">{t("status.underInspection", "Under Inspection")}</SelectItem>
                  <SelectItem value="resolved">{t("status.resolved")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
              {getStatusLabel(localStatus)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{formatLocation(issue.latitude, issue.longitude)}</span>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {new Date(issue.created_at).toLocaleDateString(
                i18n.language === "ar" ? "ar-LB" : i18n.language === "fr" ? "fr-FR" : "en-US",
              )}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default IssueCard;

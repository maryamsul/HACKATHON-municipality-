import { Issue, ISSUE_STATUSES, IssueStatus } from "@/types/issue";
import { MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIssues } from "@/context/IssuesContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

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

  const formatLocation = (lat: number, lng: number) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "under_review":
        return t("status.underReview");
      case "under_maintenance":
        return t("status.underMaintenance");
      case "resolved":
        return t("status.resolved");
      default:
        return status;
    }
  };

  const currentStatus = ISSUE_STATUSES[localStatus] || ISSUE_STATUSES.under_review;

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (newStatus === localStatus) return;

    // Ensure ID is numeric for the "issue" type logic in the Edge Function
    const issueId = typeof issue.id === "number" ? issue.id : parseInt(String(issue.id), 10);

    if (isNaN(issueId) || issueId <= 0) {
      toast({
        title: t("common.error"),
        description: "Invalid issue ID",
        variant: "destructive",
      });
      return;
    }

    // 1. OPTIMISTIC UPDATE: Change UI immediately
    setLocalStatus(newStatus);
    updateIssueOptimistic(issueId, {
      status: newStatus,
      assigned_to: null,
    });

    try {
      // 2. CALL EDGE FUNCTION
      const { data, error: invokeError } = await supabase.functions.invoke("classify-report", {
        body: {
          type: "issue",
          id: issueId,
          status: newStatus,
          assigned_to: null,
        },
      });

      // 3. CHECK FOR NETWORK ERRORS
      if (invokeError) {
        console.error("[IssueCard] Supabase invoke error:", invokeError);
        setLocalStatus(issue.status as IssueStatus);
        await refetchIssues();
        toast({
          title: t("common.error"),
          description: t("issueDetails.failedToUpdateStatus"),
          variant: "destructive",
        });
        return;
      }

      console.log("[IssueCard] API response:", { data, dataSuccess: data?.success, dataType: typeof data?.success });

      // 4. CHECK API RESPONSE SUCCESS
      if (data && (data.success === true || data.success === "true")) {
        // Refetch to ensure we have the latest database state
        await refetchIssues();
        
        toast({
          title: t("issueDetails.statusUpdated"),
          description: `${t("issueDetails.issueMarkedAs")} ${getStatusLabel(newStatus)}`,
        });
      } else {
        // API returned failure - revert optimistic update
        console.error("[IssueCard] API returned failure:", data);
        setLocalStatus(issue.status as IssueStatus);
        await refetchIssues();
        
        toast({
          title: t("common.error"),
          description: data?.error || t("issueDetails.failedToUpdateStatus"),
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Status Update Failed:", err);

      // 5. REVERT UI: Snap back to original status on failure
      setLocalStatus(issue.status as IssueStatus);
      await refetchIssues();

      toast({
        title: t("common.error"),
        description: err.message || t("issueDetails.failedToUpdateStatus"),
        variant: "destructive",
      });
    }
  };

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
            <div onClick={(e) => e.stopPropagation()}>
              <Select value={localStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className={`w-36 h-7 text-xs border-0 rounded-full font-medium ${currentStatus.color}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_review">{t("status.underReview")}</SelectItem>
                  <SelectItem value="under_maintenance">{t("status.underMaintenance")}</SelectItem>
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

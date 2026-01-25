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
  const { updateIssueOptimistic } = useIssues();
  const { toast } = useToast();
  const isEmployee = profile?.role === "employee";

  // ✅ LOCAL STATE (KEY FIX)
  const [localStatus, setLocalStatus] = useState<IssueStatus>(issue.status as IssueStatus);

  // ✅ KEEP LOCAL STATE IN SYNC WITH CONTEXT
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
    // ✅ PREVENT DUPLICATE CALLS
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

    // ✅ IMMEDIATE UI UPDATE (FEELS INSTANT)
    setLocalStatus(newStatus);

    try {
      const { data, error } = await supabase.functions.invoke("classify-report", {
        body: {
          type: "issue",
          id: issueId,
          status: newStatus,
          assigned_to: null,
        },
      });

      if (error || data?.success !== true) {
        // ❌ REVERT UI IF FAILED
        setLocalStatus(issue.status as IssueStatus);

        toast({
          title: t("common.error"),
          description: data?.error || t("issueDetails.failedToUpdateStatus"),
          variant: "destructive",
        });
        return;
      }

      // ✅ UPDATE CONTEXT STATE
      updateIssueOptimistic(issueId, {
        status: newStatus,
        assigned_to: data.data?.assigned_to ?? null,
      });

      toast({
        title: t("issueDetails.statusUpdated"),
        description: `${t("issueDetails.issueMarkedAs")} ${getStatusLabel(newStatus)}`,
      });
    } catch (err) {
      // ❌ REVERT UI ON CRASH
      setLocalStatus(issue.status as IssueStatus);

      toast({
        title: t("common.error"),
        description: t("issueDetails.failedToUpdateStatus"),
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
        className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center text-3xl"
      >
        {issue.thumbnail ? (
          <img src={issue.thumbnail} alt={issue.category} className="w-full h-full object-cover" />
        ) : (
          categoryIcons[issue.category] || "📋"
        )}
      </motion.button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/issue/${issue.id}`)}>
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold truncate">{issue.title || issue.category}</h3>

          {isEmployee ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Select value={localStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className={`w-36 h-7 text-xs border-0 ${currentStatus.color}`}>
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
            <span className={`px-2 py-1 rounded-full text-xs ${currentStatus.color}`}>
              {getStatusLabel(localStatus)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>{formatLocation(issue.latitude, issue.longitude)}</span>
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
    </motion.div>
  );
};

export default IssueCard;

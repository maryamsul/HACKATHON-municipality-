// IssueCard.tsx - fixed for optimistic UI + stable state
import { Issue, ISSUE_STATUSES, IssueStatus } from "@/types/issue";
import { MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIssues } from "@/context/IssuesContext";
import { useToast } from "@/hooks/use-toast";
import { updateIssueStatus } from "@/supabase/functions/classify-report"; // use final wrapper

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

  // Local state to **control the dropdown independently**
  const [localStatus, setLocalStatus] = React.useState<IssueStatus>(issue.status as IssueStatus);

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

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (newStatus === localStatus) return; // No change

    // Optimistic update immediately
    setLocalStatus(newStatus);
    updateIssueOptimistic(issue.id, { status: newStatus });

    try {
      const result = await updateIssueStatus(issue.id, newStatus);
      if (!result.success) {
        // Revert to previous status if API fails
        toast({
          title: t("common.error"),
          description: result.error || t("issueDetails.failedToUpdateStatus"),
          variant: "destructive",
        });
        setLocalStatus(issue.status); // revert local
        updateIssueOptimistic(issue.id, { status: issue.status }); // revert context
      } else {
        // Update context with confirmed data from server
        updateIssueOptimistic(issue.id, { status: newStatus, ...result.data });
      }
    } catch (err) {
      toast({ title: t("common.error"), description: t("issueDetails.failedToUpdateStatus"), variant: "destructive" });
      setLocalStatus(issue.status);
      updateIssueOptimistic(issue.id, { status: issue.status });
    }
  };

  return (
    <motion.div
      className="w-full flex gap-4 p-4 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}
    >
      <motion.button
        onClick={() => navigate(`/issue/${issue.id}`)}
        className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-3xl overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.08 + 0.1 }}
        whileTap={{ scale: 0.98 }}
      >
        {issue.thumbnail ? (
          <img src={issue.thumbnail} alt={issue.category} className="w-full h-full object-cover" />
        ) : (
          categoryIcons[issue.category] || "📋"
        )}
      </motion.button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/issue/${issue.id}`)}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground truncate">{issue.title || issue.category}</h3>
          {isEmployee && (
            <div onClick={(e) => e.stopPropagation()}>
              <Select value={localStatus} onValueChange={(v) => handleStatusChange(v as IssueStatus)}>
                <SelectTrigger className={`w-36 h-7 text-xs font-medium border-0 ${ISSUE_STATUSES[localStatus].color}`}>
                  <SelectValue placeholder={t("status.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  <SelectItem value="under_review">{t("status.underReview")}</SelectItem>
                  <SelectItem value="under_maintenance">{t("status.underMaintenance")}</SelectItem>
                  <SelectItem value="resolved">{t("status.resolved")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate" dir="ltr">
            {formatLocation(issue.latitude, issue.longitude)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
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

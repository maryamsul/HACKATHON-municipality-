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
  const { refetchIssues } = useIssues();
  const { toast } = useToast();
  const isEmployee = profile?.role === "employee";

  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'under_review':
        return t('status.underReview');
      case 'under_maintenance':
        return t('status.underMaintenance');
      case 'resolved':
        return t('status.resolved');
      default:
        return status;
    }
  };

  const currentStatus = ISSUE_STATUSES[issue.status as IssueStatus] || ISSUE_STATUSES.under_review;

  const handleStatusChange = async (newStatus: string) => {
    // Ensure issue.id is a number (issues use numeric IDs)
    const issueId = typeof issue.id === "number" ? issue.id : parseInt(String(issue.id), 10);
    
    console.log(`[IssueCard] Updating issue status - id: ${issueId} (typeof: ${typeof issueId}), newStatus: ${newStatus}`);
    
    if (isNaN(issueId) || issueId <= 0) {
      console.error(`[IssueCard] Invalid issue ID: ${issue.id}`);
      toast({ title: t('common.error'), description: "Invalid issue ID", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("classify-report", {
        body: { type: "issue", id: issueId, status: newStatus },
      });

      if (error || !data?.success) throw error || new Error(data?.error || "Update failed");
      
      await refetchIssues();
      toast({ 
        title: t('issueDetails.statusUpdated'), 
        description: `${t('issueDetails.issueMarkedAs')} ${getStatusLabel(newStatus)}` 
      });
    } catch (error) {
      console.error("[IssueCard] Status update failed:", error);
      toast({ title: t('common.error'), description: t('issueDetails.failedToUpdateStatus'), variant: "destructive" });
    }
  };

  return (
    <motion.div
      className="w-full flex gap-4 p-4 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
      }}
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
          {isEmployee ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={issue.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger 
                  className={`w-36 h-7 text-xs font-medium border-0 ${currentStatus.color}`}
                >
                  <SelectValue placeholder={t('status.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  <SelectItem value="under_review">{t('status.underReview')}</SelectItem>
                  <SelectItem value="under_maintenance">{t('status.underMaintenance')}</SelectItem>
                  <SelectItem value="resolved">{t('status.resolved')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <motion.span 
              className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${currentStatus.color}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.08 + 0.15 }}
            >
              {getStatusLabel(issue.status)}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate" dir="ltr">{formatLocation(issue.latitude, issue.longitude)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(issue.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-LB' : i18n.language === 'fr' ? 'fr-FR' : 'en-US')}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default IssueCard;

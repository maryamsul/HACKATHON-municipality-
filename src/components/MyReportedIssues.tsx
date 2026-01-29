import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIssues } from "@/context/IssuesContext";
import { useAuth } from "@/context/AuthContext";
import {
  FileWarning,
  MapPin,
  Calendar,
  Clock,
  Eye,
  Wrench,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MyReportedIssues = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { issues, loading } = useIssues();
  const { user } = useAuth();
  const isRTL = i18n.language === "ar";

  // Filter issues reported by the current user
  const myIssues = issues.filter((issue) => issue.reported_by === user?.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return Clock;
      case "pending_approved":
        return AlertCircle;
      case "under_review":
        return Eye;
      case "under_maintenance":
        return Wrench;
      case "resolved":
        return CheckCircle2;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "pending_approved":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
      case "under_review":
        return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
      case "under_maintenance":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("status.pendingNew", "Pending Review");
      case "pending_approved":
        return t("status.pending", "Pending");
      case "under_review":
        return t("status.underReview", "Under Review");
      case "under_maintenance":
        return t("status.underMaintenance", "Under Maintenance");
      case "resolved":
        return t("status.resolved", "Resolved");
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (myIssues.length === 0) {
    return (
      <div className="p-6 text-center">
        <FileWarning className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {t("settings.noReportedIssues", "You haven't reported any issues yet")}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      <AnimatePresence mode="popLayout">
        {myIssues.map((issue, index) => {
          const StatusIcon = getStatusIcon(issue.status);
          return (
            <motion.button
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/issue/${issue.id}`)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
            >
              {/* Thumbnail or Icon */}
              {issue.thumbnail ? (
                <img
                  src={issue.thumbnail}
                  alt={issue.title}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileWarning className="w-6 h-6 text-primary" />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={`flex items-start justify-between gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h4 className="font-medium text-sm truncate">
                    {issue.title || issue.category}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 flex items-center gap-1 text-xs ${getStatusColor(issue.status)}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {getStatusLabel(issue.status)}
                  </Badge>
                </div>

                <div className={`flex items-center gap-3 text-xs text-muted-foreground ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  {issue.latitude && issue.longitude && (
                    <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <MapPin className="w-3 h-3" />
                      <span dir="ltr">
                        {issue.latitude.toFixed(2)}, {issue.longitude.toFixed(2)}
                      </span>
                    </span>
                  )}
                  <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Calendar className="w-3 h-3" />
                    {new Date(issue.created_at).toLocaleDateString(
                      i18n.language === "ar" ? "ar-LB" : i18n.language === "fr" ? "fr-FR" : "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight className={`w-5 h-5 text-muted-foreground flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default MyReportedIssues;

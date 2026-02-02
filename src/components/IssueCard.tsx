import { Issue, ISSUE_STATUSES, IssueStatus } from "@/types/issue";
import { MapPin, Calendar, Check, X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useIssues } from "@/context/IssuesContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { updateIssueStatus, dismissIssue } from "@/api/issueApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { updateIssueOptimistic, refetchIssues, removeIssueOptimistic } = useIssues();
  const { toast } = useToast();
  const isEmployee = profile?.role === "employee";

  // LOCAL STATE FOR UI RESPONSIVENESS
  const [localStatus, setLocalStatus] = useState<IssueStatus>(issue.status as IssueStatus);
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

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
        // Keep the status value, but label it as “Under inspection”
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
      assigned_to: undefined,
    });

    try {
      // 2. CALL API LAYER (uses Edge Function internally)
      const result = await updateIssueStatus(issueId, newStatus, null);

      console.log("[IssueCard] API response:", JSON.stringify(result));

      // 3. CHECK API RESPONSE SUCCESS
      if (result.success) {
        // Show success toast immediately
        toast({
          title: t("issueDetails.statusUpdated"),
          description: `${t("issueDetails.issueMarkedAs")} ${getStatusLabel(newStatus)}`,
        });
        
        // Refetch in background (don't await to avoid blocking)
        refetchIssues().catch(err => console.log("[IssueCard] Background refetch error:", err));
      } else {
        // Only show error if API explicitly returned failure
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

      // 5. REVERT UI: Snap back to original status on failure
      setLocalStatus(issue.status as IssueStatus);

      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: t("common.error"),
        description: message || t("issueDetails.failedToUpdateStatus"),
        variant: "destructive",
      });
    }
  };

  // Handle Accept action for pending issues - moves to pending_approved
  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handleStatusChange("pending_approved");
  };

  // Handle Dismiss action - deletes the issue completely via API
  // IMPORTANT: Do NOT remove optimistically - only remove after backend confirms deletion
  const handleDismiss = async () => {
    setIsDismissing(true);
    const issueId = typeof issue.id === "number" ? issue.id : Number(issue.id);

    if (!Number.isFinite(issueId) || issueId <= 0) {
      console.error("[IssueCard] Invalid issue ID:", issue.id, "->", issueId);
      toast({
        title: t("common.error"),
        description: "Invalid issue ID",
        variant: "destructive",
      });
      setIsDismissing(false);
      setShowDismissDialog(false);
      return;
    }

    console.log("[IssueCard] Dismissing issue ID:", issueId, "(original:", issue.id, ")");

    try {
      const result = await dismissIssue(issueId);

      console.log("[IssueCard] Dismiss response:", JSON.stringify(result));

      if (result.success) {
        // Only remove from UI AFTER backend confirms deletion succeeded
        removeIssueOptimistic(issueId);
        toast({
          title: t("common.success"),
          description: t("issueDetails.issueDismissed"),
        });
        // Background sync (non-blocking)
        refetchIssues().catch(err => console.log("[IssueCard] Background refetch error:", err));
      } else {
        console.error("[IssueCard] Dismiss API error:", result);
        toast({
          title: t("common.error"),
          description: result.error || t("issueDetails.failedToDismiss"),
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[IssueCard] Dismiss exception:", message);
      toast({
        title: t("common.error"),
        description: message || t("issueDetails.failedToDismiss"),
        variant: "destructive",
      });
    } finally {
      setIsDismissing(false);
      setShowDismissDialog(false);
    }
  };

  // Check if this is a newly reported pending issue (employees can Accept/Dismiss)
  const isNewlyReported = localStatus === "pending";

  return (
    <>
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

            {isEmployee && isNewlyReported ? (
              // Show Accept/Dismiss buttons for newly reported issues
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                  onClick={handleAccept}
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {t("issueDetails.accept")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDismissDialog(true);
                  }}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  {t("issueDetails.dismiss")}
                </Button>
              </div>
            ) : isEmployee ? (
              // Show status dropdown for approved issues
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

      {/* Dismiss Confirmation Dialog */}
      <AlertDialog open={showDismissDialog} onOpenChange={setShowDismissDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("issueDetails.dismissTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("issueDetails.dismissDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDismissing}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDismiss();
              }}
              disabled={isDismissing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDismissing ? t("common.loading") : t("issueDetails.dismiss")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default IssueCard;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  MapPin,
  Filter,
  FileWarning,
  Eye,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import BottomNav from "@/components/BottomNav";
import { useBuildings } from "@/context/BuildingsContext";
import { useIssues } from "@/context/IssuesContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BuildingAlerts = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { buildings, loading: buildingsLoading } = useBuildings();
  const { issues, loading: issuesLoading, refetchIssues, updateIssueOptimistic } = useIssues();
  const { profile, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [dismissIssueId, setDismissIssueId] = useState<number | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  const isEmployee = profile?.role === "employee";
  const loading = buildingsLoading || issuesLoading;

  // Redirect non-employees
  if (!isAuthenticated || !isEmployee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-2">{t("alerts.employeeOnly", "Employee Access Only")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("alerts.employeeOnlyDesc", "This page is restricted to municipality employees.")}
          </p>
          <Button onClick={() => navigate("/")}>
            {t("common.back", "Go Back")}
          </Button>
        </div>
      </div>
    );
  }

  // Filter pending items
  const pendingBuildings = buildings.filter((b) => b.status === "pending");
  const pendingIssues = issues.filter((i) => i.status === "pending");
  const totalPending = pendingBuildings.length + pendingIssues.length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "pending_approved":
        return Clock;
      case "critical":
        return AlertTriangle;
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
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
      case "pending_approved":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
      case "critical":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400";
      case "under_review":
        return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
      case "under_maintenance":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("issues.pendingNew", "Pending (New)");
      case "pending_approved":
        // Accepted -> treat as normal Pending for employees (but keep distinct status value)
        return t("status.pending", "Pending");
      case "critical":
        return t("buildings.statusCritical", "Critical");
      case "under_review":
        return t("issues.underReview", "Under Review");
      case "under_maintenance":
        return t("buildings.statusInspection", "Under Inspection");
      case "resolved":
        return t("buildings.statusResolved", "Resolved");
      default:
        return status;
    }
  };

  // Handle Accept action - moves issue to pending_approved
  const handleAcceptIssue = async (issueId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic update
    updateIssueOptimistic(issueId, { status: "pending_approved" });

    try {
      const { data, error } = await supabase.functions.invoke("classify-report", {
        body: {
          type: "issue",
          id: issueId,
          status: "pending_approved",
        },
      });

      console.log("[BuildingAlerts] Accept response:", { data, error });

      if (error) {
        console.error("[BuildingAlerts] Accept error:", error);
        throw error;
      }

      if (data?.success) {
        toast({
          title: t("issueDetails.statusUpdated"),
          description: t("issueDetails.issueAccepted", "Issue has been accepted and is now visible to all users"),
        });
        refetchIssues();
      } else {
        toast({
          title: t("common.error"),
          description: data?.error || t("issueDetails.failedToUpdateStatus"),
          variant: "destructive",
        });
        refetchIssues(); // Revert
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[BuildingAlerts] Accept Failed:", message);
      toast({
        title: t("common.error"),
        description: message || t("issueDetails.failedToUpdateStatus"),
        variant: "destructive",
      });
      refetchIssues(); // Revert
    }
  };

  // Handle Dismiss action - deletes the issue
  const handleDismissIssue = async () => {
    if (!dismissIssueId) return;
    setIsDismissing(true);

    console.log("[BuildingAlerts] Dismissing issue ID:", dismissIssueId);

    try {
      const { data, error } = await supabase.functions.invoke("classify-report", {
        body: {
          type: "issue",
          id: dismissIssueId,
          action: "dismiss",
        },
      });

      console.log("[BuildingAlerts] Dismiss response:", { data, error });

      if (error) {
        console.error("[BuildingAlerts] Dismiss invoke error:", error);
        toast({
          title: t("common.error"),
          description: t("issueDetails.failedToDismiss", "Failed to dismiss issue"),
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: t("common.success"),
          description: t("issueDetails.issueDismissed", "Issue has been dismissed"),
        });
        refetchIssues();
      } else {
        toast({
          title: t("common.error"),
          description: data?.error || t("issueDetails.failedToDismiss", "Failed to dismiss issue"),
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[BuildingAlerts] Dismiss exception:", message);
      toast({
        title: t("common.error"),
        description: message || t("issueDetails.failedToDismiss", "Failed to dismiss issue"),
        variant: "destructive",
      });
    } finally {
      setIsDismissing(false);
      setDismissIssueId(null);
    }
  };

  // Handle status change for approved issues
  const handleStatusChange = async (issueId: number, newStatus: string) => {
    updateIssueOptimistic(issueId, { status: newStatus as "under_review" | "under_maintenance" | "resolved" });

    try {
      const { data, error } = await supabase.functions.invoke("classify-report", {
        body: {
          type: "issue",
          id: issueId,
          status: newStatus,
        },
      });

      console.log("[BuildingAlerts] Status change response:", { data, error });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: t("issueDetails.statusUpdated"),
          description: `${t("issueDetails.issueMarkedAs", "Issue marked as")} ${getStatusLabel(newStatus)}`,
        });
        refetchIssues();
      } else {
        toast({
          title: t("common.error"),
          description: data?.error || t("issueDetails.failedToUpdateStatus"),
          variant: "destructive",
        });
        refetchIssues();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[BuildingAlerts] Status change failed:", message);
      toast({
        title: t("common.error"),
        description: message || t("issueDetails.failedToUpdateStatus"),
        variant: "destructive",
      });
      refetchIssues();
    }
  };

  const renderBuildingCard = (building: typeof buildings[0], isPending: boolean) => {
    const StatusIcon = getStatusIcon(building.status);
    return (
      <motion.div
        key={`building-${building.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`${
          isPending
            ? "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800"
            : "bg-card border border-border"
        } rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
        onClick={() => navigate("/buildings-at-risk")}
      >
        <div className="flex items-start gap-3">
          {building.thumbnail ? (
            <img
              src={building.thumbnail}
              alt={building.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-border"
            />
          ) : (
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isPending ? "bg-amber-100 dark:bg-amber-800/50" : "bg-destructive/10"
            }`}>
              <Building2 className={`w-8 h-8 ${isPending ? "text-amber-600" : "text-destructive"}`} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <Badge variant="outline" className="mb-1 text-xs bg-destructive/10 text-destructive border-destructive/30">
                  <Building2 className="w-3 h-3 mr-1" />
                  {t("alerts.building", "Building")}
                </Badge>
                <h3 className="font-semibold text-foreground truncate">
                  {building.building_name || building.title}
                </h3>
              </div>
              <Badge
                variant="outline"
                className={`flex-shrink-0 flex items-center gap-1 ${getStatusColor(building.status)}`}
              >
                <StatusIcon className="w-3 h-3" />
                {getStatusLabel(building.status)}
              </Badge>
            </div>

            {building.latitude && building.longitude && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <MapPin className="w-3 h-3" />
                <span dir="ltr">
                  {building.latitude.toFixed(4)}, {building.longitude.toFixed(4)}
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {building.description}
            </p>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(building.created_at).toLocaleDateString(
                  i18n.language === "ar" ? "ar-LB" : "en-US",
                  { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                )}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render issue card with Accept/Dismiss actions for pending issues
  const renderIssueCard = (issue: typeof issues[0], isPending: boolean) => {
    const StatusIcon = getStatusIcon(issue.status);
    const isNewlyReported = issue.status === "pending";
    const isApproved = issue.status !== "pending" && issue.status !== "resolved";
    
    return (
      <motion.div
        key={`issue-${issue.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`${
          isPending
            ? "bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800"
            : "bg-card border border-border"
        } rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}
      >
        <div 
          className="flex items-start gap-3 cursor-pointer"
          onClick={() => navigate(`/issue/${issue.id}`)}
        >
          {issue.thumbnail ? (
            <img
              src={issue.thumbnail}
              alt={issue.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-border"
            />
          ) : (
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isPending ? "bg-orange-100 dark:bg-orange-800/50" : "bg-primary/10"
            }`}>
              <FileWarning className={`w-8 h-8 ${isPending ? "text-orange-600" : "text-primary"}`} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <Badge variant="outline" className="mb-1 text-xs bg-primary/10 text-primary border-primary/30">
                  <FileWarning className="w-3 h-3 mr-1" />
                  {issue.category}
                </Badge>
                <h3 className="font-semibold text-foreground truncate">
                  {issue.title}
                </h3>
              </div>
              <Badge
                variant="outline"
                className={`flex-shrink-0 flex items-center gap-1 ${getStatusColor(issue.status)}`}
              >
                <StatusIcon className="w-3 h-3" />
                {getStatusLabel(issue.status)}
              </Badge>
            </div>

            {issue.latitude && issue.longitude && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <MapPin className="w-3 h-3" />
                <span dir="ltr">
                  {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {issue.description}
            </p>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(issue.created_at).toLocaleDateString(
                  i18n.language === "ar" ? "ar-LB" : "en-US",
                  { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Accept/Dismiss actions for newly reported issues */}
        {isNewlyReported && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 bg-green-50 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              onClick={(e) => handleAcceptIssue(issue.id, e)}
            >
              <Check className="w-4 h-4 mr-1.5" />
              {t("issueDetails.accept", "Accept")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 bg-red-50 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
              onClick={(e) => {
                e.stopPropagation();
                setDismissIssueId(issue.id);
              }}
            >
              <X className="w-4 h-4 mr-1.5" />
              {t("issueDetails.dismiss", "Dismiss")}
            </Button>
          </div>
        )}

        {/* Status dropdown for approved/in-progress issues */}
        {isApproved && (
          <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
            <Select value={issue.status} onValueChange={(value) => handleStatusChange(issue.id, value)}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder={t("status.statusPlaceholder", "Select status")} />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
              <SelectItem value="pending_approved">{t("status.pending", "Pending")}</SelectItem>
                <SelectItem value="under_review">{t("status.underReview", "Under Review")}</SelectItem>
              <SelectItem value="under_maintenance">{t("buildings.statusInspection", "Under Inspection")}</SelectItem>
                <SelectItem value="resolved">{t("status.resolved", "Resolved")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </motion.div>
    );
  };

  // Filter based on tab and status filter
  const getFilteredBuildings = () => {
    if (filterStatus === "all") return buildings;
    return buildings.filter((b) => b.status === filterStatus);
  };

  const getFilteredIssues = () => {
    if (filterStatus === "all") return issues;
    return issues.filter((i) => i.status === filterStatus);
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white px-4 py-6 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t("alerts.title", "Alerts & Reports")}
            </h1>
            <p className="text-white/80 text-sm">
              {totalPending} {t("alerts.pendingReports", "pending reports")}
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <p className="text-sm text-white/90">
            {t("alerts.reviewInfo", "Review new reports: Accept to make visible to users, or Dismiss to delete.")}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={t("alerts.filterBy", "Filter by status")} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50 border-border">
              <SelectItem value="all">{t("filters.all", "All")}</SelectItem>
              <SelectItem value="pending">{t("issues.pendingNew", "Pending (New)")}</SelectItem>
              <SelectItem value="pending_approved">{t("status.pending", "Pending")}</SelectItem>
              <SelectItem value="critical">{t("buildings.statusCritical", "Critical")}</SelectItem>
              <SelectItem value="under_review">{t("issues.underReview", "Under Review")}</SelectItem>
              <SelectItem value="under_maintenance">{t("buildings.statusInspection", "Under Inspection")}</SelectItem>
              <SelectItem value="resolved">{t("buildings.statusResolved", "Resolved")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4 bg-muted">
            <TabsTrigger value="all" className="flex-1">
              {t("filters.all", "All")}
            </TabsTrigger>
            <TabsTrigger value="buildings" className="flex-1">
              <Building2 className="w-4 h-4 mr-1" />
              {t("alerts.buildings", "Buildings")}
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex-1">
              <FileWarning className="w-4 h-4 mr-1" />
              {t("alerts.issues", "Issues")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">{t("common.loading")}</p>
            ) : (
              <AnimatePresence mode="popLayout">
                {/* Pending items first */}
                {pendingBuildings.length > 0 && filterStatus === "all" && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t("alerts.pendingBuildings", "Pending Buildings")} ({pendingBuildings.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingBuildings.map((b) => renderBuildingCard(b, true))}
                    </div>
                  </div>
                )}

                {pendingIssues.length > 0 && filterStatus === "all" && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t("alerts.pendingIssues", "Pending Issues")} ({pendingIssues.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingIssues.map((i) => renderIssueCard(i, true))}
                    </div>
                  </div>
                )}

                {/* All filtered items */}
                {filterStatus !== "all" && (
                  <div className="space-y-3">
                    {getFilteredBuildings().map((b) => renderBuildingCard(b, b.status === "pending"))}
                    {getFilteredIssues().map((i) => renderIssueCard(i, i.status === "pending"))}
                  </div>
                )}

                {filterStatus === "all" && pendingBuildings.length === 0 && pendingIssues.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-medium">{t("alerts.allClear", "All Clear!")}</p>
                    <p className="text-muted-foreground">{t("alerts.noPending", "No pending reports to review")}</p>
                  </div>
                )}
              </AnimatePresence>
            )}
          </TabsContent>

          <TabsContent value="buildings" className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">{t("common.loading")}</p>
            ) : getFilteredBuildings().length > 0 ? (
              <AnimatePresence mode="popLayout">
                {getFilteredBuildings().map((b) => renderBuildingCard(b, b.status === "pending"))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t("alerts.noBuildingReports", "No building reports")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">{t("common.loading")}</p>
            ) : getFilteredIssues().length > 0 ? (
              <AnimatePresence mode="popLayout">
                {getFilteredIssues().map((i) => renderIssueCard(i, i.status === "pending"))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileWarning className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t("alerts.noIssueReports", "No issue reports")}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dismiss Confirmation Dialog */}
      <AlertDialog open={dismissIssueId !== null} onOpenChange={(open) => !open && setDismissIssueId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("issueDetails.dismissTitle", "Dismiss Issue")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("issueDetails.dismissDescription", "This will permanently delete this issue report. This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDismissing}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDismissIssue}
              disabled={isDismissing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDismissing ? t("common.loading") : t("issueDetails.dismiss", "Dismiss")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default BuildingAlerts;

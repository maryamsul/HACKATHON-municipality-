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
import BottomNav from "@/components/BottomNav";
import { useBuildings } from "@/context/BuildingsContext";
import { useIssues } from "@/context/IssuesContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BuildingStatus } from "@/types/building";
import { IssueStatus } from "@/types/issue";

const BuildingAlerts = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { buildings, loading: buildingsLoading, refetchBuildings } = useBuildings();
  const { issues, loading: issuesLoading, refetchIssues } = useIssues();
  const { profile, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");

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

  // Filter pending items - Buildings use "pending", Issues use "Under Review" as initial status
  const pendingBuildings = buildings.filter((b) => b.status === "pending");
  const pendingIssues = issues.filter((i) => i.status === "Under Review");
  const totalPending = pendingBuildings.length + pendingIssues.length;

  // Classify building
  const handleClassifyBuilding = async (buildingId: string, newStatus: BuildingStatus) => {
    try {
      const { data, error } = await supabase.functions.invoke("classify-report", {
        body: { type: "building", id: buildingId, status: newStatus },
      });

      if (error || !data?.success) throw error || new Error(data?.error || "Update failed");

      await refetchBuildings();
      toast({
        title: t("common.success"),
        description: t("alerts.classified", "Report has been classified successfully"),
      });
    } catch (error) {
      console.error("Error classifying building:", error);
      toast({
        title: t("common.error"),
        description: t("alerts.classifyError", "Failed to classify report"),
        variant: "destructive",
      });
    }
  };

  // Classify issue
  const handleClassifyIssue = async (issueId: number, newStatus: IssueStatus) => {
    try {
      const { data, error } = await supabase.functions.invoke("classify-report", {
        body: { type: "issue", id: issueId, status: newStatus },
      });

      if (error || !data?.success) throw error || new Error(data?.error || "Update failed");

      await refetchIssues();
      toast({
        title: t("common.success"),
        description: t("alerts.classified", "Report has been classified successfully"),
      });
    } catch (error) {
      console.error("Error classifying issue:", error);
      toast({
        title: t("common.error"),
        description: t("alerts.classifyError", "Failed to classify report"),
        variant: "destructive",
      });
    }
  };

  // Status icons - using exact DB values
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return Clock;
      case "Critical":
        return AlertTriangle;
      case "Under Review":
        return Eye;
      case "Under Inspection":
      case "Under Maintenance":
        return Wrench;
      case "Resolved":
        return CheckCircle2;
      default:
        return Clock;
    }
  };

  // Status colors - using exact DB values
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400";
      case "Under Review":
        return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
      case "Under Inspection":
      case "Under Maintenance":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
      case "Resolved":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Status labels - using exact DB values
  const getStatusLabel = (status: string, type: "building" | "issue") => {
    switch (status) {
      case "pending":
        return t("buildings.statusReported", "Pending");
      case "Critical":
        return t("buildings.statusCritical", "Critical");
      case "Under Review":
        return t("issues.underReview", "Under Review");
      case "Under Inspection":
        return t("buildings.statusInspection", "Under Inspection");
      case "Under Maintenance":
        return t("issues.underMaintenance", "Under Maintenance");
      case "Resolved":
        return t("buildings.statusResolved", "Resolved");
      default:
        return status;
    }
  };

  // Render building card
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
        } rounded-xl p-4 shadow-sm`}
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
                {getStatusLabel(building.status, "building")}
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

            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(building.created_at).toLocaleDateString(
                  i18n.language === "ar" ? "ar-LB" : "en-US",
                  { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                )}
              </span>
            </div>

            {/* Classification Buttons - Using exact DB values */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={building.status === "Critical" ? "default" : "destructive"}
                onClick={() => handleClassifyBuilding(building.id, "Critical")}
                className="flex items-center gap-1"
                disabled={building.status === "Critical"}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {t("buildings.statusCritical", "Critical")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleClassifyBuilding(building.id, "Under Inspection")}
                className={`flex items-center gap-1 ${
                  building.status === "Under Inspection" 
                    ? "bg-amber-500 text-white" 
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300"
                }`}
                disabled={building.status === "Under Inspection"}
              >
                <Wrench className="w-3.5 h-3.5" />
                {t("buildings.statusInspection", "Inspection")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleClassifyBuilding(building.id, "Resolved")}
                className={`flex items-center gap-1 ${
                  building.status === "Resolved"
                    ? "bg-green-500 text-white border-green-500"
                    : "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                }`}
                disabled={building.status === "Resolved"}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("buildings.statusResolved", "Resolved")}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render issue card
  const renderIssueCard = (issue: typeof issues[0], isPending: boolean) => {
    const StatusIcon = getStatusIcon(issue.status);
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
        } rounded-xl p-4 shadow-sm`}
      >
        <div className="flex items-start gap-3">
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
                {getStatusLabel(issue.status, "issue")}
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

            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(issue.created_at).toLocaleDateString(
                  i18n.language === "ar" ? "ar-LB" : "en-US",
                  { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                )}
              </span>
            </div>

            {/* Classification Buttons for Issues - Using exact DB values */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleClassifyIssue(issue.id, "Under Review")}
                className={`flex items-center gap-1 ${
                  issue.status === "Under Review"
                    ? "bg-orange-500 text-white"
                    : "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/50 dark:text-orange-300"
                }`}
                disabled={issue.status === "Under Review"}
              >
                <Eye className="w-3.5 h-3.5" />
                {t("issues.underReview", "Under Review")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleClassifyIssue(issue.id, "Under Maintenance")}
                className={`flex items-center gap-1 ${
                  issue.status === "Under Maintenance"
                    ? "bg-amber-500 text-white"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300"
                }`}
                disabled={issue.status === "Under Maintenance"}
              >
                <Wrench className="w-3.5 h-3.5" />
                {t("issues.underMaintenance", "Maintenance")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleClassifyIssue(issue.id, "Resolved")}
                className={`flex items-center gap-1 ${
                  issue.status === "Resolved"
                    ? "bg-green-500 text-white border-green-500"
                    : "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                }`}
                disabled={issue.status === "Resolved"}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("buildings.statusResolved", "Resolved")}
              </Button>
            </div>
          </div>
        </div>
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

        {/* Filter - Using exact DB values */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={t("alerts.filterBy", "Filter by status")} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">{t("filters.all", "All")}</SelectItem>
              <SelectItem value="pending">{t("buildings.statusReported", "Pending")}</SelectItem>
              <SelectItem value="Critical">{t("buildings.statusCritical", "Critical")}</SelectItem>
              <SelectItem value="Under Review">{t("issues.underReview", "Under Review")}</SelectItem>
              <SelectItem value="Under Inspection">{t("buildings.statusInspection", "Under Inspection")}</SelectItem>
              <SelectItem value="Under Maintenance">{t("issues.underMaintenance", "Under Maintenance")}</SelectItem>
              <SelectItem value="Resolved">{t("buildings.statusResolved", "Resolved")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-[140px] bg-background z-[5] px-4 pt-4 pb-2 border-b">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Bell className="w-4 h-4" />
              {t("filters.all", "All")}
              {totalPending > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {totalPending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="buildings" className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {t("alerts.buildings", "Buildings")}
              {pendingBuildings.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-destructive text-white">
                  {pendingBuildings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-1">
              <FileWarning className="w-4 h-4" />
              {t("alerts.issues", "Issues")}
              {pendingIssues.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-orange-500 text-white">
                  {pendingIssues.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t("common.loading", "Loading...")}
          </div>
        ) : (
          <>
            {/* All Tab */}
            <TabsContent value="all" className="p-4 space-y-4 mt-0">
              {/* Pending Section */}
              {totalPending > 0 && filterStatus !== "Resolved" && filterStatus !== "Critical" && filterStatus !== "Under Inspection" && filterStatus !== "Under Review" && filterStatus !== "Under Maintenance" && (
                <section>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Clock className="w-5 h-5" />
                    {t("alerts.awaitingClassification", "Awaiting Classification")} ({totalPending})
                  </h2>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {pendingBuildings.map((building) => renderBuildingCard(building, true))}
                      {pendingIssues.map((issue) => renderIssueCard(issue, true))}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {/* Classified Section */}
              {(getFilteredBuildings().filter(b => b.status !== "pending").length > 0 || 
                getFilteredIssues().filter(i => i.status !== "Under Review").length > 0) && (
                <section>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {t("alerts.classifiedReports", "Classified Reports")}
                  </h2>
                  <div className="space-y-3">
                    {getFilteredBuildings().filter(b => b.status !== "pending").map((building) => renderBuildingCard(building, false))}
                    {getFilteredIssues().filter(i => i.status !== "Under Review").map((issue) => renderIssueCard(issue, false))}
                  </div>
                </section>
              )}

              {getFilteredBuildings().length === 0 && getFilteredIssues().length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>{t("alerts.noAlerts", "No reports found")}</p>
                </div>
              )}
            </TabsContent>

            {/* Buildings Tab */}
            <TabsContent value="buildings" className="p-4 space-y-3 mt-0">
              {getFilteredBuildings().length > 0 ? (
                <AnimatePresence>
                  {getFilteredBuildings().map((building) => 
                    renderBuildingCard(building, building.status === "pending")
                  )}
                </AnimatePresence>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>{t("alerts.noBuildings", "No building reports found")}</p>
                </div>
              )}
            </TabsContent>

            {/* Issues Tab */}
            <TabsContent value="issues" className="p-4 space-y-3 mt-0">
              {getFilteredIssues().length > 0 ? (
                <AnimatePresence>
                  {getFilteredIssues().map((issue) => 
                    renderIssueCard(issue, issue.status === "Under Review")
                  )}
                </AnimatePresence>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileWarning className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>{t("alerts.noIssues", "No issue reports found")}</p>
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      <BottomNav />
    </div>
  );
};

export default BuildingAlerts;

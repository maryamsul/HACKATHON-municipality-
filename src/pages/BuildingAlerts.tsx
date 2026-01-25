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
import BottomNav from "@/components/BottomNav";
import { useBuildings } from "@/context/BuildingsContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BuildingStatus } from "@/types/building";

const BuildingAlerts = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { buildings, loading, refetchBuildings } = useBuildings();
  const { profile, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const isEmployee = profile?.role === "employee";

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

  // Filter pending buildings for alerts
  const pendingBuildings = buildings.filter((b) => b.status === "pending");
  const classifiedBuildings = buildings.filter((b) => b.status !== "pending");

  // Apply additional filter
  const filteredBuildings =
    filterStatus === "all"
      ? buildings
      : filterStatus === "pending"
      ? pendingBuildings
      : buildings.filter((b) => b.status === filterStatus);

  const handleClassify = async (buildingId: string, newStatus: BuildingStatus) => {
    try {
      const { error } = await supabase
        .from("buildings_at_risk")
        .update({ status: newStatus })
        .eq("id", buildingId);

      if (error) throw error;

      await refetchBuildings();
      toast({
        title: t("common.success"),
        description: t("alerts.classified", "Building has been classified successfully"),
      });
    } catch (error) {
      console.error("Error classifying building:", error);
      toast({
        title: t("common.error"),
        description: t("alerts.classifyError", "Failed to classify building"),
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: BuildingStatus) => {
    switch (status) {
      case "pending":
        return Clock;
      case "critical":
        return AlertTriangle;
      case "under_maintenance":
        return Wrench;
      case "resolved":
        return CheckCircle2;
    }
  };

  const getStatusColor = (status: BuildingStatus) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
      case "critical":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400";
      case "under_maintenance":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  const getStatusLabel = (status: BuildingStatus) => {
    switch (status) {
      case "pending":
        return t("buildings.statusReported", "Pending");
      case "critical":
        return t("buildings.statusCritical", "Critical");
      case "under_maintenance":
        return t("buildings.statusInspection", "Under Maintenance");
      case "resolved":
        return t("buildings.statusResolved", "Resolved");
    }
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
              {t("alerts.title", "Building Alerts")}
            </h1>
            <p className="text-white/80 text-sm">
              {pendingBuildings.length} {t("alerts.pendingReports", "pending reports")}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={t("alerts.filterBy", "Filter by status")} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">{t("filters.all", "All")}</SelectItem>
              <SelectItem value="pending">{t("buildings.statusReported", "Pending")}</SelectItem>
              <SelectItem value="critical">{t("buildings.statusCritical", "Critical")}</SelectItem>
              <SelectItem value="under_maintenance">
                {t("buildings.statusInspection", "Under Maintenance")}
              </SelectItem>
              <SelectItem value="resolved">{t("buildings.statusResolved", "Resolved")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Pending Alerts Section */}
      {pendingBuildings.length > 0 && filterStatus !== "resolved" && filterStatus !== "critical" && filterStatus !== "under_maintenance" && (
        <section className="p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
            {t("alerts.awaitingClassification", "Awaiting Classification")}
          </h2>
          <div className="space-y-3">
            <AnimatePresence>
              {pendingBuildings.map((building, index) => {
                const StatusIcon = getStatusIcon(building.status);
                return (
                  <motion.div
                    key={building.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {building.thumbnail ? (
                        <img
                          src={building.thumbnail}
                          alt={building.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-amber-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {building.building_name || building.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`flex-shrink-0 flex items-center gap-1 ${getStatusColor(
                              building.status
                            )}`}
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

                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(building.created_at).toLocaleDateString(
                              i18n.language === "ar" ? "ar-LB" : "en-US",
                              { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>

                        {/* Classification Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleClassify(building.id, "critical")}
                            className="flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t("buildings.statusCritical", "Critical")}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleClassify(building.id, "under_maintenance")}
                            className="flex items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            {t("buildings.statusInspection", "Maintenance")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClassify(building.id, "resolved")}
                            className="flex items-center gap-1 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t("buildings.statusResolved", "Resolved")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Classified Buildings */}
      {(filterStatus === "all" ? classifiedBuildings : filteredBuildings.filter(b => b.status !== "pending")).length > 0 && (
        <section className="p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t("alerts.classifiedBuildings", "Classified Buildings")}
          </h2>
          <div className="space-y-3">
            {(filterStatus === "all" ? classifiedBuildings : filteredBuildings.filter(b => b.status !== "pending")).map((building, index) => {
              const StatusIcon = getStatusIcon(building.status);
              return (
                <motion.div
                  key={building.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-card rounded-xl p-4 shadow-sm border border-border"
                >
                  <div className="flex items-start gap-3">
                    {building.thumbnail ? (
                      <img
                        src={building.thumbnail}
                        alt={building.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          building.status === "critical"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : building.status === "under_maintenance"
                            ? "bg-amber-100 dark:bg-amber-900/30"
                            : "bg-green-100 dark:bg-green-900/30"
                        }`}
                      >
                        <StatusIcon
                          className={`w-6 h-6 ${
                            building.status === "critical"
                              ? "text-red-600 dark:text-red-400"
                              : building.status === "under_maintenance"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium truncate">{building.building_name || building.title}</h3>
                        <Select
                          value={building.status}
                          onValueChange={(v) => handleClassify(building.id, v as BuildingStatus)}
                        >
                          <SelectTrigger className="w-[140px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="critical">
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {t("buildings.statusCritical", "Critical")}
                              </div>
                            </SelectItem>
                            <SelectItem value="under_maintenance">
                              <div className="flex items-center gap-1">
                                <Wrench className="w-3 h-3" />
                                {t("buildings.statusInspection", "Maintenance")}
                              </div>
                            </SelectItem>
                            <SelectItem value="resolved">
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {t("buildings.statusResolved", "Resolved")}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {building.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("common.loading", "Loading...")}
        </div>
      ) : filteredBuildings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>{t("alerts.noAlerts", "No building alerts")}</p>
        </div>
      ) : null}

      <BottomNav />
    </div>
  );
};

export default BuildingAlerts;

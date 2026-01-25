import { motion } from "framer-motion";
import React from "react";
import { 
  Building2, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Wrench, 
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BuildingAtRisk, BuildingStatus, BUILDING_STATUSES } from "@/types/building";

interface BuildingRiskCardProps {
  building: BuildingAtRisk;
  index: number;
  isEmployee: boolean;
  onStatusChange: (buildingId: string, newStatus: BuildingStatus) => void;
}

// Status-specific styling with colors matching requirements
// Database statuses: pending | Critical | Under Inspection | Resolved
const getStatusConfig = (status: BuildingStatus) => {
  switch (status) {
    case "pending":
      return {
        badgeClass: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        iconBgClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        Icon: Clock,
        dotColor: "bg-gray-500",
      };
    case "Critical":
      return {
        badgeClass: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
        iconBgClass: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        Icon: AlertTriangle,
        dotColor: "bg-red-500",
      };
    case "Under Inspection":
      return {
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        iconBgClass: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        Icon: Wrench,
        dotColor: "bg-amber-500",
      };
    case "Resolved":
      return {
        badgeClass: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        iconBgClass: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        Icon: CheckCircle2,
        dotColor: "bg-green-500",
      };
  }
};

export default function BuildingRiskCard({ building, index, isEmployee, onStatusChange }: BuildingRiskCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const statusConfig = getStatusConfig(building.status);
  const StatusIcon = statusConfig.Icon;

  const getStatusLabel = (status: BuildingStatus) => {
    switch (status) {
      case "pending":
        return t("buildings.statusReported", "Pending");
      case "Critical":
        return t("buildings.statusCritical", "Critical");
      case "Under Inspection":
        return t("buildings.statusInspection", "Under Inspection");
      case "Resolved":
        return t("buildings.statusResolved", "Resolved");
    }
  };

  // Employees can change status; for pending items, show classification options
  const availableStatuses: BuildingStatus[] = isEmployee 
    ? ["Critical", "Under Inspection", "Resolved"] 
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail or Status Icon */}
        {building.thumbnail ? (
          <img
            src={building.thumbnail}
            alt={building.title}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-border"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig.iconBgClass}`}
          >
            <StatusIcon className="w-7 h-7" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title and Status Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground truncate text-base">
              {building.building_name || building.title}
            </h3>

            {isEmployee ? (
              <Select value={building.status} onValueChange={(v) => onStatusChange(building.id, v as BuildingStatus)}>
                <SelectTrigger className="w-[160px] h-8 text-xs bg-background border-border">
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className="w-3.5 h-3.5" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 border-border">
                  {(Object.keys(BUILDING_STATUSES) as BuildingStatus[]).map((status) => {
                    const config = getStatusConfig(status);
                    const Icon = config.Icon;
                    return (
                      <SelectItem key={status} value={status} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{getStatusLabel(status)}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <Badge 
                variant="outline" 
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 ${statusConfig.badgeClass}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {getStatusLabel(building.status)}
              </Badge>
            )}
          </div>

          {/* Location */}
          {building.latitude && building.longitude && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate" dir="ltr">
                {building.latitude.toFixed(4)}, {building.longitude.toFixed(4)}
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{building.description}</p>

          {/* Footer with Date */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(building.created_at).toLocaleDateString(
                  i18n.language === "ar" ? "ar-LB" : i18n.language === "fr" ? "fr-FR" : "en-US",
                  { year: "numeric", month: "short", day: "numeric" }
                )}
              </span>
            </div>
            {/* Status indicator dot for quick visual reference */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                building.status === "Critical" ? "bg-red-500" :
                building.status === "Under Inspection" ? "bg-amber-500" :
                building.status === "Resolved" ? "bg-green-500" :
                "bg-gray-500"
              }`} />
              <span className="capitalize">{getStatusLabel(building.status)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

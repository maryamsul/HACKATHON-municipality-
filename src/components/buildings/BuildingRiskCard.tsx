import { motion } from "framer-motion";
import { Building2, Calendar, MapPin } from "lucide-react";
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

const getBadgeVariant = (status: BuildingStatus) => {
  switch (status) {
    case "critical":
      return "destructive" as const;
    case "under_maintenance":
      return "secondary" as const;
    case "resolved":
      return "default" as const;
  }
};

const getIconStyle = (status: BuildingStatus) => {
  switch (status) {
    case "critical":
      return "bg-destructive/15 text-destructive";
    case "under_maintenance":
      return "bg-primary/15 text-primary";
    case "resolved":
      return "bg-primary/10 text-primary";
  }
};

export default function BuildingRiskCard({ building, index, isEmployee, onStatusChange }: BuildingRiskCardProps) {
  const { t, i18n } = useTranslation();

  const getStatusLabel = (status: BuildingStatus) => {
    switch (status) {
      case "critical":
        return t("buildings.statusCritical", "Critical");
      case "under_maintenance":
        return t("buildings.statusInspection", "Under Maintenance");
      case "resolved":
        return t("buildings.statusResolved", "Resolved");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-xl p-4 shadow-sm border border-border"
    >
      <div className="flex items-start gap-4">
        {building.thumbnail ? (
          <img
            src={building.thumbnail}
            alt={building.title}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconStyle(
              building.status,
            )}`}
          >
            <Building2 className="w-6 h-6" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{building.building_name || building.title}</h3>

            {isEmployee ? (
              <Select value={building.status} onValueChange={(v) => onStatusChange(building.id, v as BuildingStatus)}>
                <SelectTrigger className="w-[160px] h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {(Object.keys(BUILDING_STATUSES) as BuildingStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={getBadgeVariant(building.status)} className="flex-shrink-0">
                {getStatusLabel(building.status)}
              </Badge>
            )}
          </div>

          {building.latitude && building.longitude && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate" dir="ltr">
                {building.latitude.toFixed(4)}, {building.longitude.toFixed(4)}
              </span>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{building.description}</p>

          <div className="flex items-center justify-end text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(building.created_at).toLocaleDateString(
                  i18n.language === "ar" ? "ar-LB" : i18n.language === "fr" ? "fr-FR" : "en-US",
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

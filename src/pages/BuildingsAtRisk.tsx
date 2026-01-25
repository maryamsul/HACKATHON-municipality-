import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Building2, Search, AlertTriangle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import AddBuildingAtRiskForm from "@/components/AddBuildingAtRiskForm";
import BuildingRiskCard from "@/components/buildings/BuildingRiskCard";
import { useBuildings } from "@/context/BuildingsContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BuildingStatus } from "@/types/building";

const BuildingsAtRisk = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { buildings, loading, refetchBuildings } = useBuildings();
  const { profile, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  
  // Employee check using database role from AuthContext
  const isEmployee = profile?.role === "employee";

  const handleReportClick = () => {
    if (!isAuthenticated) {
      toast({
        title: t('addIssue.authRequired'),
        description: t('addIssue.pleaseSignIn'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setShowReportForm(true);
  };

  // Filter buildings: public users see all buildings (for now, until proper classification workflow)
  // Employees see all buildings including pending
  // NOTE: Once employees start classifying, citizens will only see non-pending
  const visibleBuildings = buildings;

  const filteredBuildings = visibleBuildings.filter(
    (building) =>
      (building.building_name || building.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status labels (Buildings-at-Risk required values)
  const getStatusLabel = (status: BuildingStatus) => {
    switch (status) {
      case 'critical':
        return t('buildings.statusCritical', 'Critical');
      case 'under_maintenance':
        return t('buildings.statusInspection', 'Under Maintenance');
      case 'resolved':
        return t('buildings.statusResolved', 'Resolved');
      default:
        return status;
    }
  };

  // Employee-only status change handler
  const handleStatusChange = async (buildingId: string, newStatus: BuildingStatus) => {
    if (!isEmployee) {
      toast({
        title: t('common.error'),
        description: t('buildings.employeeOnly', 'Only employees can change status'),
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("buildings_at_risk")
        .update({ status: newStatus })
        .eq("id", buildingId);

      if (error) throw error;

      await refetchBuildings();
      toast({
        title: t('common.success'),
        description: t('buildings.statusUpdated'),
      });
    } catch (error) {
      console.error("Error updating building status:", error);
      toast({
        title: t('common.error'),
        description: t('buildings.statusUpdateError'),
        variant: "destructive",
      });
    }
  };

  // Count by normalized status (only from visible buildings for public)
  const statusCounts = {
    pending: visibleBuildings.filter((b) => b.status === "pending").length,
    critical: visibleBuildings.filter((b) => b.status === "critical").length,
    under_maintenance: visibleBuildings.filter((b) => b.status === "under_maintenance").length,
    resolved: visibleBuildings.filter((b) => b.status === "resolved").length,
  };

  if (showReportForm) {
    return <AddBuildingAtRiskForm onClose={() => setShowReportForm(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground px-4 py-6 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-destructive-foreground/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('buildings.title')}
            </h1>
            <p className="text-destructive-foreground/80 text-sm">
              {visibleBuildings.length} {t('buildings.totalBuildings')}
            </p>
          </div>
        </div>
        
        {/* Report Building Button - Prominent CTA */}
        <Button 
          onClick={handleReportClick}
          className="w-full mb-4 bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('buildings.reportButton')}
        </Button>
        
        {/* Status Summary - Show pending count only for employees */}
        <div className="flex gap-2 flex-wrap mb-4">
          {isEmployee && statusCounts.pending > 0 && (
            <Badge variant="outline" className="bg-gray-100/20 text-destructive-foreground border-destructive-foreground/30">
              {statusCounts.pending} {t("buildings.statusReported", "Pending")}
            </Badge>
          )}
          <Badge variant="destructive" className="bg-destructive/15 text-destructive-foreground">
            {statusCounts.critical} {t("buildings.critical", "Critical")}
          </Badge>
          <Badge variant="secondary" className="bg-secondary/50 text-destructive-foreground">
            {statusCounts.under_maintenance} {t("buildings.inspecting", "Under Maintenance")}
          </Badge>
          <Badge variant="default" className="bg-primary/15 text-destructive-foreground">
            {statusCounts.resolved} {t("buildings.statusResolved", "Resolved")}
          </Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-destructive-foreground/60`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('buildings.searchPlaceholder')}
            className={`${isRTL ? 'pr-10' : 'pl-10'} bg-destructive-foreground/10 border-destructive-foreground/20 text-destructive-foreground placeholder:text-destructive-foreground/60`}
          />
        </div>
      </header>

      {/* Buildings List */}
      <main className="p-4 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">{t("common.loading")}</p>
        ) : filteredBuildings.length > 0 ? (
          filteredBuildings.map((building, index) => (
            <BuildingRiskCard
              key={building.id}
              building={building}
              index={index}
              isEmployee={isEmployee}
              onStatusChange={handleStatusChange}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>{t('buildings.noBuildings')}</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default BuildingsAtRisk;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Building2, Search, MapPin, Calendar, AlertTriangle, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import AddBuildingAtRiskForm from "@/components/AddBuildingAtRiskForm";
import { useBuildings } from "@/context/BuildingsContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BuildingStatus, BUILDING_STATUSES } from "@/types/building";

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

  const filteredBuildings = buildings.filter(
    (building) =>
      (building.building_name || building.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status labels aligned with Issues behavior
  const getStatusLabel = (status: BuildingStatus) => {
    switch (status) {
      case 'under_review':
        return t('buildings.statusCritical', 'Critical');
      case 'under_maintenance':
        return t('buildings.statusInspection', 'Under Inspection');
      case 'resolved':
        return t('buildings.statusResolved', 'Resolved');
      default:
        return status;
    }
  };

  // Status styling aligned with Issues
  const getStatusStyle = (status: BuildingStatus) => {
    switch (status) {
      case 'under_review':
        return { bg: 'bg-red-100', text: 'text-red-600', badge: 'bg-red-100 text-red-700' };
      case 'under_maintenance':
        return { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' };
      case 'resolved':
        return { bg: 'bg-green-100', text: 'text-green-600', badge: 'bg-green-100 text-green-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' };
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

  // Count by normalized status
  const statusCounts = {
    under_review: buildings.filter(b => b.status === "under_review").length,
    under_maintenance: buildings.filter(b => b.status === "under_maintenance").length,
    resolved: buildings.filter(b => b.status === "resolved").length,
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
              {buildings.length} {t('buildings.totalBuildings')}
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
        
        {/* Status Summary - Aligned with Issues */}
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="px-2 py-1 bg-red-500/20 rounded-full text-xs font-medium">
            {statusCounts.under_review} {t('buildings.critical', 'Critical')}
          </span>
          <span className="px-2 py-1 bg-blue-500/20 rounded-full text-xs font-medium">
            {statusCounts.under_maintenance} {t('buildings.inspecting', 'Inspecting')}
          </span>
          <span className="px-2 py-1 bg-green-500/20 rounded-full text-xs font-medium">
            {statusCounts.resolved} {t('buildings.statusResolved', 'Resolved')}
          </span>
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
          <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>
        ) : filteredBuildings.length > 0 ? (
          filteredBuildings.map((building, index) => {
            const statusStyle = getStatusStyle(building.status);
            return (
              <motion.div
                key={building.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl p-4 shadow-sm border border-border"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail or Icon */}
                  {building.thumbnail ? (
                    <img 
                      src={building.thumbnail} 
                      alt={building.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusStyle.bg}`}>
                      <Building2 className={`w-6 h-6 ${statusStyle.text}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{building.building_name || building.title}</h3>
                      {/* Employee-only status dropdown */}
                      {isEmployee ? (
                        <Select
                          value={building.status}
                          onValueChange={(value) => handleStatusChange(building.id, value as BuildingStatus)}
                        >
                          <SelectTrigger className="w-[140px] h-7 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            {Object.keys(BUILDING_STATUSES).map((status) => (
                              <SelectItem key={status} value={status}>
                                {getStatusLabel(status as BuildingStatus)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        /* Read-only badge for non-employees */
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusStyle.badge}`}>
                          {getStatusLabel(building.status)}
                        </span>
                      )}
                    </div>
                    
                    {building.latitude && building.longitude && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{building.latitude.toFixed(4)}, {building.longitude.toFixed(4)}</span>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {building.description}
                    </p>
                    
                    <div className="flex items-center justify-end text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(building.created_at).toLocaleDateString(
                            i18n.language === 'ar' ? 'ar-LB' : i18n.language === 'fr' ? 'fr-FR' : 'en-US'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
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

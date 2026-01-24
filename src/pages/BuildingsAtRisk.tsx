import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Building2, Search, MapPin, Calendar, AlertTriangle, User, Plus } from "lucide-react";
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
      building.building_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (building.address?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      building.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusLabel = (status: BuildingStatus) => {
    switch (status) {
      case 'pending':
        return t('buildings.statusReported');
      case 'under_inspection':
        return t('buildings.statusInspection');
      case 'resolved':
        return t('buildings.statusResolved');
      default:
        return status;
    }
  };

  const getStatusStyle = (status: BuildingStatus) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-orange-100', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' };
      case 'under_inspection':
        return { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' };
      case 'resolved':
        return { bg: 'bg-green-100', text: 'text-green-600', badge: 'bg-green-100 text-green-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleStatusChange = async (buildingId: string, newStatus: BuildingStatus) => {
    try {
      const { error } = await supabase
        .from("buildings_at_risk")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
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

  // Count by status
  const statusCounts = {
    pending: buildings.filter(b => b.status === "pending").length,
    under_inspection: buildings.filter(b => b.status === "under_inspection").length,
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
        
        {/* Status Summary */}
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="px-2 py-1 bg-orange-500/20 rounded-full text-xs font-medium">
            {statusCounts.pending} {t('buildings.reported')}
          </span>
          <span className="px-2 py-1 bg-blue-500/20 rounded-full text-xs font-medium">
            {statusCounts.under_inspection} {t('buildings.inspecting')}
          </span>
          <span className="px-2 py-1 bg-green-500/20 rounded-full text-xs font-medium">
            {statusCounts.resolved} {t('buildings.statusResolved')}
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
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusStyle.bg}`}>
                    <Building2 className={`w-6 h-6 ${statusStyle.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{building.building_name}</h3>
                      
                      {/* Employee Status Select or Badge */}
                      {isEmployee ? (
                        <Select
                          value={building.status}
                          onValueChange={(value) => handleStatusChange(building.id, value as BuildingStatus)}
                        >
                          <SelectTrigger className="w-[140px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(BUILDING_STATUSES).map((status) => (
                              <SelectItem key={status} value={status}>
                                {getStatusLabel(status as BuildingStatus)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusStyle.badge}`}>
                          {getStatusLabel(building.status)}
                        </span>
                      )}
                    </div>
                    
                    {building.address && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{building.address}</span>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {building.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>
                          {building.reporter_type === 'employee' ? t('buildings.employee') : t('buildings.citizen')}
                        </span>
                      </div>
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

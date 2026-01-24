import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Building2, Search, MapPin, Calendar, AlertTriangle, User } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

type BuildingStatus = "reported" | "under_inspection" | "critical" | "resolved";

interface BuildingReport {
  id: string;
  building_name: string;
  address: string;
  latitude: number;
  longitude: number;
  reported_by: string;
  reporter_type: "citizen" | "employee";
  status: BuildingStatus;
  description: string;
  created_at: string;
}

const STATUS_STYLES: Record<BuildingStatus, { label: string; color: string }> = {
  reported: { label: "Reported", color: "bg-orange-100 text-orange-700" },
  under_inspection: { label: "Under Inspection", color: "bg-blue-100 text-blue-700" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
};

// Mock data with translation keys - will be replaced with real database fetch
const getMockBuildings = (t: (key: string) => string): BuildingReport[] => [
  {
    id: "1",
    building_name: t('buildings.building1Name'),
    address: t('buildings.building1Address'),
    latitude: 33.8938,
    longitude: 35.5018,
    reported_by: t('buildings.reporterAhmad'),
    reporter_type: "citizen",
    status: "critical",
    description: t('buildings.building1Desc'),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    building_name: t('buildings.building2Name'),
    address: t('buildings.building2Address'),
    latitude: 34.4367,
    longitude: 35.8497,
    reported_by: t('buildings.reporterInspector'),
    reporter_type: "employee",
    status: "under_inspection",
    description: t('buildings.building2Desc'),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    building_name: t('buildings.building3Name'),
    address: t('buildings.building3Address'),
    latitude: 33.5572,
    longitude: 35.3729,
    reported_by: t('buildings.reporterLayla'),
    reporter_type: "citizen",
    status: "reported",
    description: t('buildings.building3Desc'),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    building_name: t('buildings.building4Name'),
    address: t('buildings.building4Address'),
    latitude: 33.8463,
    longitude: 35.9020,
    reported_by: t('buildings.reporterSafetyOfficer'),
    reporter_type: "employee",
    status: "resolved",
    description: t('buildings.building4Desc'),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    building_name: t('buildings.building5Name'),
    address: t('buildings.building5Address'),
    latitude: 33.2705,
    longitude: 35.2038,
    reported_by: t('buildings.reporterOmar'),
    reporter_type: "citizen",
    status: "critical",
    description: t('buildings.building5Desc'),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const BuildingsAtRisk = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const buildings = getMockBuildings(t);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const filteredBuildings = buildings.filter(
    (building) =>
      building.building_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusLabel = (status: BuildingStatus) => {
    switch (status) {
      case 'reported':
        return t('buildings.statusReported');
      case 'under_inspection':
        return t('buildings.statusInspection');
      case 'critical':
        return t('buildings.statusCritical');
      case 'resolved':
        return t('buildings.statusResolved');
      default:
        return status;
    }
  };

  // Count by status
  const statusCounts = {
    critical: buildings.filter(b => b.status === "critical").length,
    reported: buildings.filter(b => b.status === "reported").length,
    under_inspection: buildings.filter(b => b.status === "under_inspection").length,
    resolved: buildings.filter(b => b.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground px-4 py-6 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-destructive-foreground/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('buildings.title')}
            </h1>
            <p className="text-destructive-foreground/80 text-sm">
              {buildings.length} {t('buildings.totalBuildings')}
            </p>
          </div>
        </div>
        
        {/* Status Summary */}
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="px-2 py-1 bg-red-500/20 rounded-full text-xs font-medium">
            {statusCounts.critical} {t('buildings.critical')}
          </span>
          <span className="px-2 py-1 bg-orange-500/20 rounded-full text-xs font-medium">
            {statusCounts.reported} {t('buildings.reported')}
          </span>
          <span className="px-2 py-1 bg-blue-500/20 rounded-full text-xs font-medium">
            {statusCounts.under_inspection} {t('buildings.inspecting')}
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
          filteredBuildings.map((building, index) => (
            <motion.div
              key={building.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl p-4 shadow-sm border border-border"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  building.status === 'critical' ? 'bg-red-100' : 
                  building.status === 'under_inspection' ? 'bg-blue-100' : 
                  building.status === 'resolved' ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  <Building2 className={`w-6 h-6 ${
                    building.status === 'critical' ? 'text-red-600' : 
                    building.status === 'under_inspection' ? 'text-blue-600' : 
                    building.status === 'resolved' ? 'text-green-600' : 'text-orange-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{building.building_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_STYLES[building.status].color}`}>
                      {getStatusLabel(building.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{building.address}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {building.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>
                        {building.reported_by} 
                        ({building.reporter_type === 'employee' ? t('buildings.employee') : t('buildings.citizen')})
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

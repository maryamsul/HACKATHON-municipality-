import { ArrowLeft, Bell, CheckCircle2, Clock, Wrench, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { useIssues } from "@/context/IssuesContext";
import { useBuildings } from "@/context/BuildingsContext";
import { useAuth } from "@/context/AuthContext";

const Notifications = () => {
  const navigate = useNavigate();
  const { issues } = useIssues();
  const { buildings } = useBuildings();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Filter user's own reports - issues don't have pending anymore, buildings do
  const issueItems = user ? issues.filter((i) => i.reported_by === user.id) : [];
  const buildingItems = (user ? buildings.filter((b) => b.reported_by === user.id) : []).filter((b) => b.status !== "pending");

  const getItemTime = (item: any) => {
    const ts = item.updated_at || item.created_at;
    return new Date(ts).getTime();
  };

  // Generate notifications based on the current user's reports (issues + buildings)
  // Using exact DB status values:
  // Issues: "Under Review", "Under Maintenance", "Resolved"
  // Buildings: "pending", "Critical", "Under Inspection", "Resolved"
  const notifications = [...issueItems.map((issue) => ({
    kind: "issue" as const,
    key: `issue-${issue.id}`,
    status: issue.status,
    title:
      issue.status === "Resolved"
        ? `${t('dashboard.resolved')}: ${t(`categories.${issue.category.toLowerCase().replace(' ', '')}` as any) || issue.category}`
        : issue.status === "Under Maintenance"
        ? `${t('dashboard.underMaintenance')}: ${t(`categories.${issue.category.toLowerCase().replace(' ', '')}` as any) || issue.category}`
        : `${t('dashboard.underReview')}: ${t(`categories.${issue.category.toLowerCase().replace(' ', '')}` as any) || issue.category}`,
    message:
      issue.status === "Resolved"
        ? `${t('issueDetails.location')}: ${formatLocation(issue.latitude, issue.longitude)} - ${t('dashboard.resolved')}`
        : issue.status === "Under Maintenance"
        ? `${t('issueDetails.location')}: ${formatLocation(issue.latitude, issue.longitude)} - ${t('dashboard.underMaintenance')}`
        : `${t('issueDetails.location')}: ${formatLocation(issue.latitude, issue.longitude)} - ${t('dashboard.underReview')}`,
    time: new Date(issue.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-LB' : i18n.language === 'fr' ? 'fr-FR' : 'en-US'),
    navigateTo: `/issue/${issue.id}`,
    sortTime: getItemTime(issue),
  })),
  ...buildingItems.map((building) => ({
    kind: "building" as const,
    key: `building-${building.id}`,
    status: building.status,
    title:
      building.status === "Resolved"
        ? `${t('buildings.statusResolved')}: ${building.building_name || building.title}`
        : building.status === "Under Inspection"
        ? `${t('buildings.statusInspection')}: ${building.building_name || building.title}`
        : `${t('buildings.statusCritical')}: ${building.building_name || building.title}`,
    message:
      `${t('buildings.title')}: ${building.building_name || building.title}`,
    time: new Date((building as any).updated_at || building.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-LB' : i18n.language === 'fr' ? 'fr-FR' : 'en-US'),
    navigateTo: `/buildings-at-risk`,
    sortTime: getItemTime(building),
  }))]
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 10)
    .map((n, idx) => ({ ...n, id: idx }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "Under Maintenance":
      case "Under Inspection":
        return <Wrench className="w-5 h-5 text-blue-500" />;
      case "Critical":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 bg-background border-b border-border px-4 py-4 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('notifications.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('notifications.subtitle')}
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-3">
        <AnimatePresence>
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(notification.navigateTo)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getStatusIcon(notification.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>{t('notifications.empty')}</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;

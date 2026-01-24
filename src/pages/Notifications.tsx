import { ArrowLeft, Bell, CheckCircle2, Clock, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { useIssues } from "@/context/IssuesContext";

const Notifications = () => {
  const navigate = useNavigate();
  const { issues } = useIssues();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Generate notifications based on recent issues
  const notifications = issues.slice(0, 5).map((issue, index) => ({
    id: index,
    title:
      issue.status === "resolved"
        ? `${t('dashboard.resolved')}: ${t(`categories.${issue.category.toLowerCase().replace(' ', '')}` as any) || issue.category}`
        : issue.status === "under_maintenance"
        ? `${t('dashboard.underMaintenance')}: ${t(`categories.${issue.category.toLowerCase().replace(' ', '')}` as any) || issue.category}`
        : `${t('dashboard.underReview')}: ${t(`categories.${issue.category.toLowerCase().replace(' ', '')}` as any) || issue.category}`,
    message:
      issue.status === "resolved"
        ? `${t('issueDetails.location')}: ${formatLocation(issue.latitude, issue.longitude)} - ${t('dashboard.resolved')}`
        : issue.status === "under_maintenance"
        ? `${t('issueDetails.location')}: ${formatLocation(issue.latitude, issue.longitude)} - ${t('dashboard.underMaintenance')}`
        : `${t('issueDetails.location')}: ${formatLocation(issue.latitude, issue.longitude)} - ${t('dashboard.underReview')}`,
    time: new Date(issue.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-LB' : i18n.language === 'fr' ? 'fr-FR' : 'en-US'),
    status: issue.status,
    issueId: issue.id,
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "under_maintenance":
        return <Wrench className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.header 
        className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ 
                rotate: [0, -15, 15, -15, 0],
              }}
              transition={{ 
                duration: 0.5, 
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Bell className="w-6 h-6" />
            </motion.div>
            <h1 className="text-xl font-bold">{t('notifications.title')}</h1>
          </div>
        </div>
      </motion.header>

      <motion.div 
        className="p-4 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence>
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <motion.button
                key={notification.id}
                onClick={() => navigate(`/issue/${notification.issueId}`)}
                className={`w-full bg-card rounded-xl p-4 shadow-sm ${isRTL ? 'text-right' : 'text-left'} hover:shadow-md transition-shadow`}
                initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02, 
                  x: isRTL ? -5 : 5,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <motion.div 
                    className="flex-shrink-0 mt-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {getStatusIcon(notification.status)}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm">
                      {notification.title}
                    </h3>
                    <p className="text-muted-foreground text-xs mt-1">
                      {notification.message}
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            <motion.div 
              className="text-center py-12 text-muted-foreground"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Bell className="w-12 h-12 mx-auto mb-4" />
              </motion.div>
              <p>{t('notifications.empty')}</p>
              <p className="text-sm mt-2">{t('notifications.emptyDesc')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default Notifications;

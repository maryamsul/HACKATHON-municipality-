import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import BottomNav from "@/components/BottomNav";
import LanguageSelector from "@/components/LanguageSelector";
import MyReportedIssues from "@/components/MyReportedIssues";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Sun, 
  Moon, 
  Monitor,
  MessageCircle,
  HelpCircle,
  Star,
  LogOut,
  FileText,
  ChevronRight,
  Settings as SettingsIcon,
  Globe,
  FileWarning
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile, user, signOut, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const isRTL = i18n.language === 'ar';

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: t('common.signOut'),
      description: t('messages.signedOut'),
    });
    navigate("/auth");
  };

  const handleContactUs = () => {
    // Use encodeURIComponent to prevent injection in mailto URLs
    const subject = encodeURIComponent("CityReport Support");
    window.location.href = `mailto:support@cityreport.app?subject=${subject}`;
  };

  const handleFAQ = () => {
    window.open("https://cityreport.app/faq", "_blank");
  };

  const handleRateApp = () => {
    toast({
      title: t('common.success'),
      description: t('messages.errorOccurred').replace('error', 'feedback'),
    });
  };

  const handlePrivacyPolicy = () => {
    window.open("https://cityreport.app/privacy", "_blank");
  };

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString(
        i18n.language === 'ar' ? 'ar-LB' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', 
        { month: "long", year: "numeric" }
      )
    : "N/A";

  const themeOptions = [
    { value: "light", labelKey: "settings.lightMode", icon: Sun },
    { value: "dark", labelKey: "settings.darkMode", icon: Moon },
    { value: "system", labelKey: "settings.systemDefault", icon: Monitor },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center p-6">
          <SettingsIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">{t('common.signIn')}</h2>
          <p className="text-muted-foreground mb-4">{t('auth.signInSubtitle')}</p>
          <Button onClick={() => navigate("/auth")}>{t('common.signIn')}</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div 
        className="bg-primary text-primary-foreground px-6 pt-12 pb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={`text-2xl font-bold tracking-tight ${isRTL ? 'text-right' : ''}`}>
          {t('settings.title')}
        </h1>
        <p className={`text-primary-foreground/70 text-sm mt-1 ${isRTL ? 'text-right' : ''}`}>
          {t('auth.signInSubtitle')}
        </p>
      </motion.div>

      <motion.div 
        className="px-4 py-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* User Profile Section */}
        <motion.section variants={itemVariants} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-muted/50">
            <h2 className={`text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <User className="w-4 h-4" />
              {t('auth.fullName')}
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Avatar and Name */}
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <motion.div 
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl font-bold text-primary-foreground">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </motion.div>
              <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                <h3 className="text-lg font-semibold">{profile?.full_name || "User"}</h3>
                <p className={`text-sm text-muted-foreground flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Mail className="w-3.5 h-3.5" />
                  {profile?.email || t('auth.email')}
                </p>
              </div>
            </div>

            <Separator />

            {/* Account Type */}
            <div className={`flex items-center justify-between py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Shield className="w-5 h-5 text-foreground" />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm font-medium">{t('auth.role')}</p>
                  <p className="text-xs text-muted-foreground">{t('auth.citizenDesc')}</p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                profile?.role === "employee" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-accent text-accent-foreground"
              }`}>
                {profile?.role === "employee" ? t('auth.employee') : t('auth.citizen')}
              </span>
            </div>

            {/* Member Since */}
            <div className={`flex items-center justify-between py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-foreground" />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm font-medium">{t('issueDetails.reportedOn')}</p>
                  <p className="text-xs text-muted-foreground">{memberSince}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Language Section */}
        <motion.section variants={itemVariants} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-muted/50">
            <h2 className={`text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Globe className="w-4 h-4" />
              {t('settings.language')}
            </h2>
          </div>
          <div className="p-4">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <p className="text-sm text-muted-foreground">{t('settings.language')}</p>
              <LanguageSelector />
            </div>
          </div>
        </motion.section>

        {/* Appearance Section */}
        <motion.section variants={itemVariants} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-muted/50">
            <h2 className={`text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Sun className="w-4 h-4" />
              {t('settings.theme')}
            </h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">{t('settings.theme')}</p>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      isActive 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50 bg-background"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {t(option.labelKey)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* My Reported Issues Section */}
        <motion.section variants={itemVariants} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-muted/50">
            <h2 className={`text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <FileWarning className="w-4 h-4" />
              {t('settings.myReportedIssues', 'My Reported Issues')}
            </h2>
          </div>
          <MyReportedIssues />
        </motion.section>

        {/* Help & Support Section */}
        <motion.section variants={itemVariants} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-muted/50">
            <h2 className={`text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <HelpCircle className="w-4 h-4" />
              {t('settings.about')}
            </h2>
          </div>
          <div className="divide-y divide-border">
            {/* Contact Us */}
            <motion.button
              onClick={handleContactUs}
              className={`w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-foreground" />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium">{t('settings.contactUs')}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Privacy Policy */}
            <motion.button
              onClick={handlePrivacyPolicy}
              className={`w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <FileText className="w-5 h-5 text-foreground" />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium">{t('settings.privacyPolicy')}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
            </motion.button>
          </div>
        </motion.section>

        {/* Sign Out Button */}
        <motion.div variants={itemVariants}>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full py-6 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
          >
            <LogOut className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.signOut')}
          </Button>
        </motion.div>

        {/* App Version */}
        <motion.p 
          variants={itemVariants}
          className="text-center text-xs text-muted-foreground pt-4"
        >
          {t('common.appName')} v1.0.0
        </motion.p>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default Settings;

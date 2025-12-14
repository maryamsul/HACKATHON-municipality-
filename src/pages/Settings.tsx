import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import BottomNav from "@/components/BottomNav";
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
  Settings as SettingsIcon
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { profile, user, signOut, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/auth");
  };

  const handleContactUs = () => {
    window.location.href = "mailto:support@cityreport.app?subject=CityReport Support";
  };

  const handleFAQ = () => {
    window.open("https://cityreport.app/faq", "_blank");
  };

  const handleRateApp = () => {
    toast({
      title: "Thank you!",
      description: "We appreciate your feedback!",
    });
  };

  const handlePrivacyPolicy = () => {
    window.open("https://cityreport.app/privacy", "_blank");
  };

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString("en-US", { 
        month: "long", 
        year: "numeric" 
      })
    : "N/A";

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
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
          <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access settings</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
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
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Manage your account & preferences</p>
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl font-bold text-primary-foreground">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{profile?.full_name || "User"}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {profile?.email || "No email"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Account Type */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Shield className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Account Type</p>
                  <p className="text-xs text-muted-foreground">Your role in the system</p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                profile?.role === "employee" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-accent text-accent-foreground"
              }`}>
                {profile?.role || "citizen"}
              </span>
            </div>

            {/* Member Since */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-xs text-muted-foreground">When you joined</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{memberSince}</span>
            </div>
          </div>
        </motion.section>

        {/* Appearance Section */}
        <motion.section variants={itemVariants} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-muted/50">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Appearance
            </h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">Choose your preferred theme</p>
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
                      {option.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Help & Support Section */}
        <motion.section variants={itemVariants} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-muted/50">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Help & Support
            </h2>
          </div>
          <div className="divide-y divide-border">
            {/* Contact Us */}
            <motion.button
              onClick={handleContactUs}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Contact Us</p>
                  <p className="text-xs text-muted-foreground">Get in touch with support</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>

            {/* FAQ */}
            <motion.button
              onClick={handleFAQ}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">FAQ & Help Center</p>
                  <p className="text-xs text-muted-foreground">Find answers to common questions</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>

            {/* Rate App */}
            <motion.button
              onClick={handleRateApp}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Star className="w-5 h-5 text-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Rate the App</p>
                  <p className="text-xs text-muted-foreground">Share your experience</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>

            {/* Privacy Policy */}
            <motion.button
              onClick={handlePrivacyPolicy}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <FileText className="w-5 h-5 text-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Privacy Policy</p>
                  <p className="text-xs text-muted-foreground">Read our privacy terms</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </motion.div>

        {/* App Version */}
        <motion.p 
          variants={itemVariants}
          className="text-center text-xs text-muted-foreground pt-4"
        >
          CityReport v1.0.0
        </motion.p>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default Settings;

import { Home, FileText, Plus, Bell, Settings, Heart, Building2, AlertTriangle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useBuildings } from "@/context/BuildingsContext";
import { useIssues } from "@/context/IssuesContext";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { buildings } = useBuildings();
  const { issues } = useIssues();

  const isEmployee = profile?.role === "employee";
  // Combined pending count from both buildings and issues
  const pendingBuildingsCount = buildings.filter((b) => b.status === "pending").length;
  const pendingIssuesCount = issues.filter((i) => i.status === "pending").length;
  const totalPendingCount = pendingBuildingsCount + pendingIssuesCount;

  // Base nav items for all users
  const baseNavItems = [
    { icon: Home, labelKey: "nav.home", path: "/" },
    { icon: FileText, labelKey: "nav.issues", path: "/issues" },
    { icon: Building2, labelKey: "nav.buildings", path: "/buildings-at-risk" },
    { icon: Plus, labelKey: "nav.add", isCenter: true, path: "/add" },
    { icon: Heart, labelKey: "nav.donors", path: "/donors" },
  ];

  // Add alerts for employees, otherwise notifications
  const navItems = isEmployee
    ? [
        ...baseNavItems,
        { icon: AlertTriangle, labelKey: "nav.alerts", path: "/building-alerts", badge: totalPendingCount },
        { icon: Settings, labelKey: "nav.settings", path: "/settings" },
      ]
    : [
        ...baseNavItems,
        { icon: Bell, labelKey: "nav.notifications", path: "/notifications" },
        { icon: Settings, labelKey: "nav.settings", path: "/settings" },
      ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border px-2 py-3 safe-area-pb z-50"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isCenter = "isCenter" in item && item.isCenter;
          return (
            <motion.button
              key={item.labelKey}
              onClick={() => navigate(item.path)}
              className={`relative flex-1 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-colors duration-200 ${
                isCenter
                  ? ""
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {isCenter ? (
                <motion.div 
                  className="relative -mt-8 w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    boxShadow: "0 8px 24px -4px hsl(var(--primary) / 0.4)",
                  }}
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-primary"
                    animate={{
                      opacity: [0.5, 0.2, 0.5],
                      scale: [1, 1.15, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ zIndex: -1, filter: "blur(12px)" }}
                  />
                </motion.div>
              ) : (
                <>
                  <motion.div
                    className={`relative p-2 rounded-xl transition-colors ${
                      isActive ? "bg-primary/10" : ""
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <item.icon 
                      className={`w-5 h-5 transition-all ${
                        isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                      }`} 
                    />
                    {/* Badge for pending alerts */}
                    {"badge" in item && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </motion.div>
                  <span className={`text-[10px] font-medium transition-all ${
                    isActive ? "text-primary" : ""
                  }`}>
                    {t(item.labelKey)}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

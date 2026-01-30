import { Home, FileText, Plus, Bell, Settings, Heart, Building2, AlertTriangle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { BuildingAtRisk } from "@/types/building";
import { Issue } from "@/types/issue";

// Safe hooks that won't throw if provider is missing
const useSafeBuildings = () => {
  try {
    const { useBuildings } = require("@/context/BuildingsContext");
    return useBuildings();
  } catch {
    return { buildings: [] as BuildingAtRisk[], loading: true };
  }
};

const useSafeIssues = () => {
  try {
    const { useIssues } = require("@/context/IssuesContext");
    return useIssues();
  } catch {
    return { issues: [] as Issue[], loading: true };
  }
};

// Keys for localStorage to track seen notifications
const SEEN_NOTIFICATIONS_KEY = "seen_notification_ids";
const SEEN_EMPLOYEE_ALERTS_KEY = "seen_employee_alert_ids";

// Get seen notification IDs from localStorage
const getSeenIds = (key: string): Set<string> => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const { buildings } = useSafeBuildings();
  const { issues } = useSafeIssues();
  const [employeeUnseenCount, setEmployeeUnseenCount] = useState(0);
  const [citizenNotificationCount, setCitizenNotificationCount] = useState(0);

  const isEmployee = profile?.role === "employee";
  
  // Get pending items for employees
  const pendingBuildings = buildings.filter((b: BuildingAtRisk) => b.status === "pending");
  const pendingIssues = issues.filter((i: Issue) => i.status === "pending");

  // Employee: count unseen pending items (new reports they haven't viewed yet)
  useEffect(() => {
    if (!isEmployee) {
      setEmployeeUnseenCount(0);
      return;
    }

    const seenIds = getSeenIds(SEEN_EMPLOYEE_ALERTS_KEY);
    
    // Count unseen pending items
    const unseenBuildings = pendingBuildings.filter((b: BuildingAtRisk) => !seenIds.has(`building-${b.id}`));
    const unseenIssues = pendingIssues.filter((i: Issue) => !seenIds.has(`issue-${i.id}`));

    setEmployeeUnseenCount(unseenBuildings.length + unseenIssues.length);
  }, [buildings, issues, isEmployee, pendingBuildings, pendingIssues]);

  // Mark employee alerts as seen when visiting the alerts page
  useEffect(() => {
    if (location.pathname === "/building-alerts" && isEmployee) {
      const newSeenIds = [
        ...pendingBuildings.map((b: BuildingAtRisk) => `building-${b.id}`),
        ...pendingIssues.map((i: Issue) => `issue-${i.id}`),
      ];

      if (newSeenIds.length > 0) {
        const currentSeen = getSeenIds(SEEN_EMPLOYEE_ALERTS_KEY);
        newSeenIds.forEach((id) => currentSeen.add(id));
        localStorage.setItem(SEEN_EMPLOYEE_ALERTS_KEY, JSON.stringify([...currentSeen]));
        setEmployeeUnseenCount(0);
      }
    }
  }, [location.pathname, pendingBuildings, pendingIssues, isEmployee]);

  // Citizen: count unseen status changes on their reports
  useEffect(() => {
    if (isEmployee || !user?.id) {
      setCitizenNotificationCount(0);
      return;
    }

    // Get user's reports that have been updated (not pending anymore)
    const myBuildings = buildings.filter(
      (b: BuildingAtRisk) => b.reported_by === user.id && b.status !== "pending"
    );
    const myIssues = issues.filter(
      (i: Issue) => i.reported_by === user.id && i.status !== "pending"
    );

    // Get seen IDs
    const seenIds = getSeenIds(SEEN_NOTIFICATIONS_KEY);

    // Count unseen notifications
    const unseenBuildings = myBuildings.filter((b: BuildingAtRisk) => !seenIds.has(`building-${b.id}`));
    const unseenIssues = myIssues.filter((i: Issue) => !seenIds.has(`issue-${i.id}`));

    setCitizenNotificationCount(unseenBuildings.length + unseenIssues.length);
  }, [buildings, issues, user?.id, isEmployee]);

  // Mark notifications as seen when visiting the notifications page
  useEffect(() => {
    if (location.pathname === "/notifications" && user?.id && !isEmployee) {
      const myBuildings = buildings.filter(
        (b: BuildingAtRisk) => b.reported_by === user.id && b.status !== "pending"
      );
      const myIssues = issues.filter(
        (i: Issue) => i.reported_by === user.id && i.status !== "pending"
      );

      const newSeenIds = [
        ...myBuildings.map((b: BuildingAtRisk) => `building-${b.id}`),
        ...myIssues.map((i: Issue) => `issue-${i.id}`),
      ];

      if (newSeenIds.length > 0) {
      const currentSeen = getSeenIds(SEEN_NOTIFICATIONS_KEY);
        newSeenIds.forEach((id) => currentSeen.add(id));
        localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify([...currentSeen]));
        setCitizenNotificationCount(0);
      }
    }
  }, [location.pathname, buildings, issues, user?.id, isEmployee]);

  // Base nav items for all users
  const baseNavItems = [
    { icon: Home, labelKey: "nav.home", path: "/" },
    { icon: FileText, labelKey: "nav.issues", path: "/issues" },
    { icon: Building2, labelKey: "nav.buildings", path: "/buildings-at-risk" },
    { icon: Plus, labelKey: "nav.add", isCenter: true, path: "/add" },
    { icon: Heart, labelKey: "nav.donors", path: "/donors" },
  ];

  // Add alerts for employees (with unseen count), notifications for citizens (with unseen count)
  const navItems = isEmployee
    ? [
        ...baseNavItems,
        { icon: AlertTriangle, labelKey: "nav.alerts", path: "/building-alerts", badge: employeeUnseenCount },
        { icon: Settings, labelKey: "nav.settings", path: "/settings" },
      ]
    : [
        ...baseNavItems,
        { icon: Bell, labelKey: "nav.notifications", path: "/notifications", badge: citizenNotificationCount },
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
                    {/* Red notification badge */}
                    {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg border-2 border-background z-10">
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

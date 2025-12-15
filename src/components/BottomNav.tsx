import { Home, FileText, Plus, Bell, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: FileText, label: "Issues", path: "/issues" },
    { icon: Plus, label: "Report", isCenter: true, path: "/add" },
    { icon: Bell, label: "Alerts", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border px-2 py-3 safe-area-pb z-50"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${
                item.isCenter
                  ? ""
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              whileTap={{ scale: 0.9 }}
            >
              {item.isCenter ? (
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
                    className={`p-2 rounded-xl transition-colors ${
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
                  </motion.div>
                  <span className={`text-[10px] font-medium transition-all ${
                    isActive ? "text-primary" : ""
                  }`}>
                    {item.label}
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

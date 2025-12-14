import { Home, FileText, Plus, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: FileText, label: "Issues", path: "/issues" },
    { icon: Plus, label: "Add", isCenter: true, path: "/add" },
    { icon: Bell, label: "Alerts", path: "/notifications" },
  ];

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 safe-area-pb"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 ${
                item.isCenter
                  ? "relative -mt-6"
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              } transition-colors`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
              whileTap={{ scale: 0.9 }}
            >
              {item.isCenter ? (
                <motion.div 
                  className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, boxShadow: "0 8px 25px rgba(0,0,0,0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 4px 15px rgba(var(--primary), 0.3)",
                      "0 8px 25px rgba(var(--primary), 0.5)",
                      "0 4px 15px rgba(var(--primary), 0.3)",
                    ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 90, 0] }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ rotate: 90 }}
                  >
                    <item.icon className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <item.icon className="w-6 h-6" />
                  </motion.div>
                  <span className="text-xs">{item.label}</span>
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;

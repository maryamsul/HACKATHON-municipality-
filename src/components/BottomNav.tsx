import { Home, FileText, Plus, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 ${
                item.isCenter
                  ? "relative -mt-6"
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              } transition-colors`}
            >
              {item.isCenter ? (
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                  <item.icon className="w-7 h-7 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs">{item.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

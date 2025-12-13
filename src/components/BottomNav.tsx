import { Home, FileText, Plus, MessageCircle, User } from "lucide-react";

const BottomNav = () => {
  const navItems = [
    { icon: Home, label: "Home", active: true },
    { icon: FileText, label: "Issues", active: false },
    { icon: Plus, label: "Add", isCenter: true },
    { icon: MessageCircle, label: "Chat", active: false },
    { icon: User, label: "Profile", active: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center gap-1 p-2 ${
              item.isCenter
                ? "relative -mt-6"
                : item.active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            } transition-colors`}
          >
            {item.isCenter ? (
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors">
                <item.icon className="w-7 h-7 text-white" />
              </div>
            ) : (
              <>
                <item.icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

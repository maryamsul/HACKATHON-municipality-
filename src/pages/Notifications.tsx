import { ArrowLeft, Bell, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useIssues } from "@/context/IssuesContext";

const Notifications = () => {
  const navigate = useNavigate();
  const { issues } = useIssues();

  // Generate notifications based on recent issues
  const notifications = issues.slice(0, 5).map((issue, index) => ({
    id: index,
    title:
      issue.status === "resolved"
        ? `Issue Resolved: ${issue.category}`
        : issue.status === "in-progress"
        ? `Update: ${issue.category} issue is being addressed`
        : `New Report: ${issue.category}`,
    message:
      issue.status === "resolved"
        ? `The issue at ${issue.location} has been resolved.`
        : issue.status === "in-progress"
        ? `Work has started on the issue at ${issue.location}.`
        : `A new issue has been reported at ${issue.location}.`,
    time: issue.date,
    status: issue.status,
    issueId: issue.id,
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6" />
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => navigate(`/issue/${notification.issueId}`)}
              className="w-full bg-card rounded-xl p-4 shadow-sm text-left hover:shadow-md transition-shadow"
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(notification.status)}
                </div>
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
            </button>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notifications;

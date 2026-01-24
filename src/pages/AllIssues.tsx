import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIssues } from "@/context/IssuesContext";
import { useAuth } from "@/context/AuthContext";
import IssueCard from "@/components/IssueCard";
import BottomNav from "@/components/BottomNav";
import { ISSUE_STATUSES, IssueStatus } from "@/types/issue";

const AllIssues = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { issues, loading } = useIssues();
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const isEmployee = profile?.role === "employee";

  const statusFilter = searchParams.get("status") || "all";
  const categoryFilter = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "newest";

  const filteredIssues = issues
    .filter((issue) => {
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
      return matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'under_review':
        return t('status.underReview');
      case 'under_maintenance':
        return t('status.underMaintenance');
      case 'resolved':
        return t('status.resolved');
      default:
        return status;
    }
  };

  // Count issues by status
  const statusCounts = {
    under_review: issues.filter(i => i.status === "under_review").length,
    under_maintenance: issues.filter(i => i.status === "under_maintenance").length,
    resolved: issues.filter(i => i.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 bg-background border-b border-border px-4 py-4 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{t('common.allIssues')}</h1>
            {isEmployee && (
              <span className="text-xs text-primary font-medium">{t('common.employeeView')}</span>
            )}
          </div>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>
        ) : (
          <>
            {/* Status summary for employees */}
            {isEmployee && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(Object.keys(ISSUE_STATUSES) as IssueStatus[]).map((status) => (
                  <div 
                    key={status}
                    className={`p-3 rounded-lg text-center ${ISSUE_STATUSES[status].color}`}
                  >
                    <div className="text-lg font-bold">{statusCounts[status]}</div>
                    <div className="text-xs">{getStatusLabel(status)}</div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4">
              {filteredIssues.length} {isEmployee ? t('common.issuesToManage') : t('common.issuesReported')}
            </p>

            <div className="space-y-3">
              {filteredIssues.map((issue, index) => (
                <IssueCard key={issue.id} issue={issue} index={index} />
              ))}
            </div>

            {filteredIssues.length === 0 && (
              <p className="text-center text-muted-foreground py-8">{t('common.noResults')}</p>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default AllIssues;

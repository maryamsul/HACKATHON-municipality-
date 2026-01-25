import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useIssues } from "@/context/IssuesContext";
import IssueCard from "@/components/IssueCard";
import BottomNav from "@/components/BottomNav";

const CategoryIssues = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { issues } = useIssues();

  const decodedCategory = decodeURIComponent(category || "");
  const filteredIssues = issues.filter(
    (issue) => issue.category.toLowerCase() === decodedCategory.toLowerCase()
  );

  // Using exact DB status values: "Under Review", "Under Maintenance", "Resolved"
  const underReviewCount = filteredIssues.filter((i) => i.status === "Under Review").length;
  const underMaintenanceCount = filteredIssues.filter((i) => i.status === "Under Maintenance").length;
  const resolvedCount = filteredIssues.filter((i) => i.status === "Resolved").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{decodedCategory} {t('common.reports')}</h1>
            <p className="text-muted-foreground text-sm">{filteredIssues.length} {t('common.totalIssues')}</p>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-full">
            <span className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-sm font-medium text-orange-700">{underReviewCount} {t('status.underReview')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-sm font-medium text-blue-700">{underMaintenanceCount} {t('status.underMaintenance')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-green-700">{resolvedCount} {t('status.resolved')}</span>
          </div>
        </div>
      </header>

      {/* Issues List */}
      <section className="px-6">
        <div className="flex flex-col gap-3">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('common.noResults')}</p>
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </div>
  );
};

export default CategoryIssues;

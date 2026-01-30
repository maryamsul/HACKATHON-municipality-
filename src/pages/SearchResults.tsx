import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIssues } from "@/context/IssuesContext";
import IssueCard from "@/components/IssueCard";
import BottomNav from "@/components/BottomNav";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const query = searchParams.get("q") || "";
  const q = query.toLowerCase();
  const navigate = useNavigate();
  const { issues } = useIssues();

  const safeLower = (value: unknown) => (typeof value === "string" ? value.toLowerCase() : "");

  const filteredIssues = issues.filter(
    (issue) =>
      safeLower(issue.title).includes(q) ||
      safeLower(issue.category).includes(q) ||
      safeLower(issue.description).includes(q)
  );

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{t('common.searchResults')}</h1>
            <p className="text-blue-100 text-sm">
              {filteredIssues.length} {t('common.resultsFor')} "{query}"
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('common.noResults')} "{query}"</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchResults;

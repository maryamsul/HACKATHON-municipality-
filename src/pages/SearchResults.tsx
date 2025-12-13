import { useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIssues } from "@/context/IssuesContext";
import IssueCard from "@/components/IssueCard";
import BottomNav from "@/components/BottomNav";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const { issues } = useIssues();

  const filteredIssues = issues.filter(
    (issue) =>
      issue.location.toLowerCase().includes(query.toLowerCase()) ||
      issue.category.toLowerCase().includes(query.toLowerCase()) ||
      issue.description.toLowerCase().includes(query.toLowerCase())
  );

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
          <div>
            <h1 className="text-xl font-bold">Search Results</h1>
            <p className="text-blue-100 text-sm">
              {filteredIssues.length} results for "{query}"
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
            <p>No issues found matching "{query}"</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchResults;

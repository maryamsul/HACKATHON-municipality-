import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIssues } from "@/context/IssuesContext";
import IssueCard from "@/components/IssueCard";
import BottomNav from "@/components/BottomNav";

const AllIssues = () => {
  const navigate = useNavigate();
  const { issues, loading } = useIssues();
  const [searchParams] = useSearchParams();

  const statusFilter = searchParams.get("status") || "all";
  const categoryFilter = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "newest";

  const filteredIssues = issues
    .filter((issue) => {
      const matchesStatus =
        statusFilter === "all" || issue.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || issue.category === categoryFilter;
      return matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-background border-b border-border px-4 py-4 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">All Issues</h1>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading issues...</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredIssues.length} issues reported
            </p>
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default AllIssues;

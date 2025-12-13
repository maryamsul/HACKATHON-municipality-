import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIssues } from "@/context/IssuesContext";
import IssueCard from "@/components/IssueCard";
import BottomNav from "@/components/BottomNav";

const AllIssues = () => {
  const navigate = useNavigate();
  const { issues } = useIssues();

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
        <p className="text-sm text-muted-foreground mb-4">
          {issues.length} issues reported
        </p>
        <div className="space-y-3">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default AllIssues;

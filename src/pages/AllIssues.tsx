import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIssues } from "@/context/IssuesContext";
import { useAuth } from "@/context/AuthContext"; // Import to get the user profile
import IssueCard from "@/components/IssueCard";
import BottomNav from "@/components/BottomNav";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming you have a select component
import { Button } from "@/components/ui/button"; // Assuming you have a button component
import { supabase } from "@/integrations/supabase/client"; // Import supabase client to update issue status

const AllIssues = () => {
  const navigate = useNavigate();
  const { issues, loading, refetchIssues } = useIssues(); // Assuming `refetchIssues` reloads the issues list
  const { profile, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

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

  // Function to handle status change for employees
  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("issues").update({ status: newStatus }).eq("id", issueId);

      if (error) {
        console.error("Error updating status:", error.message);
      } else {
        // Refetch issues after status update
        refetchIssues();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-background border-b border-border px-4 py-4 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
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
            <p className="text-sm text-muted-foreground mb-4">{filteredIssues.length} issues reported</p>

            {/* Display status dropdown for employee */}
            {profile?.role === "employee" && (
              <div className="flex justify-end mb-4">
                <Select value={statusFilter} onValueChange={(newStatus) => handleStatusChange(newStatus, statusFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work_in_progress">Work in Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="flex justify-between items-center">
                  <IssueCard issue={issue} />
                  {profile?.role === "employee" && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleStatusChange(String(issue.id), "work_in_progress")}>
                        Work in Progress
                      </Button>
                      <Button variant="outline" onClick={() => handleStatusChange(String(issue.id), "resolved")}>
                        Resolved
                      </Button>
                    </div>
                  )}
                </div>
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

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Issue, IssueStatus } from "@/types/issue";
import { supabase } from "@/integrations/supabase/client";

interface IssuesContextType {
  issues: Issue[];
  loading: boolean;
  refetchIssues: () => Promise<void>;
}

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

// Normalize legacy status values to current enum values
// "pending" is now a first-class status for new reports awaiting review
const normalizeStatus = (status: string): IssueStatus => {
  const statusMap: Record<string, IssueStatus> = {
    "pending": "pending",
    "reported": "pending",
    "in-progress": "under_maintenance",
    "in_progress": "under_maintenance",
    "under_review": "under_review",
    "under_maintenance": "under_maintenance",
    "resolved": "resolved",
  };
  return statusMap[status] || "pending";
};

export const IssuesProvider = ({ children }: { children: ReactNode }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching issues:", error);
    } else {
      // Normalize status values from legacy formats
      const normalizedIssues = (data || []).map((issue) => ({
        ...issue,
        status: normalizeStatus(issue.status),
      })) as Issue[];
      setIssues(normalizedIssues);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("issues-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => {
          fetchIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <IssuesContext.Provider value={{ issues, loading, refetchIssues: fetchIssues }}>
      {children}
    </IssuesContext.Provider>
  );
};

export const useIssues = () => {
  const context = useContext(IssuesContext);
  if (!context) {
    throw new Error("useIssues must be used within IssuesProvider");
  }
  return context;
};

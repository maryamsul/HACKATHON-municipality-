import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Issue, IssueStatus } from "@/types/issue";
import { supabase } from "@/integrations/supabase/client";

interface IssuesContextType {
  issues: Issue[];
  loading: boolean;
  refetchIssues: () => Promise<void>;
  updateIssueOptimistic: (issueId: number, updates: Partial<Issue>) => void;
}

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

// Normalize legacy status values to current enum values
const normalizeStatus = (status: string): IssueStatus => {
  const statusMap: Record<string, IssueStatus> = {
    "pending": "pending",
    "pending_approved": "pending_approved",
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
      const normalizedIssues = (data || []).map((issue) => ({
        ...issue,
        status: normalizeStatus(issue.status),
      })) as Issue[];
      setIssues(normalizedIssues);
    }
    setLoading(false);
  };

  // Optimistic update for a single issue - updates state immediately without refetch
  const updateIssueOptimistic = useCallback((issueId: number, updates: Partial<Issue>) => {
    setIssues((prevIssues) =>
      prevIssues.map((issue) =>
        issue.id === issueId
          ? { ...issue, ...updates }
          : issue
      )
    );
  }, []);

  useEffect(() => {
    fetchIssues();

    // Subscribe to realtime updates - debounce to avoid overwriting optimistic updates
    let refetchTimeout: NodeJS.Timeout | null = null;
    
    const channel = supabase
      .channel("issues-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => {
          // Debounce refetch to avoid race conditions with optimistic updates
          if (refetchTimeout) clearTimeout(refetchTimeout);
          refetchTimeout = setTimeout(() => {
            fetchIssues();
          }, 500); // Wait 500ms before refetching
        }
      )
      .subscribe();

    return () => {
      if (refetchTimeout) clearTimeout(refetchTimeout);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <IssuesContext.Provider value={{ issues, loading, refetchIssues: fetchIssues, updateIssueOptimistic }}>
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

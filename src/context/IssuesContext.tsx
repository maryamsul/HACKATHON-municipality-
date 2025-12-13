import { createContext, useContext, useState, ReactNode } from "react";
import { Issue } from "@/types/issue";
import { mockIssues } from "@/data/mockIssues";

interface IssuesContextType {
  issues: Issue[];
  addIssue: (issue: Omit<Issue, "id" | "status" | "date" | "statusHistory">) => void;
}

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

export const IssuesProvider = ({ children }: { children: ReactNode }) => {
  const [issues, setIssues] = useState<Issue[]>(mockIssues);

  const addIssue = (newIssue: Omit<Issue, "id" | "status" | "date" | "statusHistory">) => {
    const issue: Issue = {
      ...newIssue,
      id: (issues.length + 1).toString(),
      status: "pending",
      date: new Date().toISOString().split("T")[0],
      statusHistory: [
        { status: "pending", date: new Date().toISOString().split("T")[0], note: "Issue reported by citizen" }
      ]
    };
    setIssues([issue, ...issues]);
  };

  return (
    <IssuesContext.Provider value={{ issues, addIssue }}>
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

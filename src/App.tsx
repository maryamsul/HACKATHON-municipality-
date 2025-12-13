import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IssuesProvider } from "./context/IssuesContext";
import Index from "./pages/Index";
import CategoryIssues from "./pages/CategoryIssues";
import IssueDetails from "./pages/IssueDetails";
import AllIssues from "./pages/AllIssues";
import AddIssue from "./pages/AddIssue";
import SearchResults from "./pages/SearchResults";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <IssuesProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/issues" element={<AllIssues />} />
            <Route path="/add" element={<AddIssue />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/category/:category" element={<CategoryIssues />} />
            <Route path="/issue/:id" element={<IssueDetails />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </IssuesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

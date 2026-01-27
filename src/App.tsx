import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { IssuesProvider } from "./context/IssuesContext";
import { BuildingsProvider } from "./context/BuildingsContext";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import CategoryIssues from "./pages/CategoryIssues";
import IssueDetails from "./pages/IssueDetails";
import AllIssues from "./pages/AllIssues";
import AddIssue from "./pages/AddIssue";
import SearchResults from "./pages/SearchResults";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Donors from "./pages/Donors";
import BuildingsAtRisk from "./pages/BuildingsAtRisk";
import BuildingAlerts from "./pages/BuildingAlerts";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <IssuesProvider>
              <BuildingsProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/issues" element={<AllIssues />} />
                    <Route path="/add" element={<AddIssue />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/donors" element={<Donors />} />
                    <Route path="/buildings-at-risk" element={<BuildingsAtRisk />} />
                    <Route path="/building-alerts" element={<BuildingAlerts />} />
                    <Route path="/category/:category" element={<CategoryIssues />} />
                    <Route path="/issue/:id" element={<IssueDetails />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </BuildingsProvider>
            </IssuesProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

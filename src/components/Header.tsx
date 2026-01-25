import { Search, SlidersHorizontal, User, LogOut, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useIssues } from "@/context/IssuesContext";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LanguageSelector from "@/components/LanguageSelector";
interface HeaderProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: FilterOptions) => void;
  showSearch?: boolean;
}

export interface FilterOptions {
  status: string;
  category: string;
  sortBy: string;
}

const categoryIcons: Record<string, string> = {
  Pothole: "🕳️",
  Garbage: "🗑️",
  "Water Leak": "💧",
  Lighting: "💡",
  Traffic: "🚦",
  Other: "📋",
};

const Header = ({ onFilter, showSearch = true }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    category: "all",
    sortBy: "newest",
  });
  const navigate = useNavigate();
  const { issues } = useIssues();
  const { profile, isAuthenticated, signOut } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const isRTL = i18n.language === 'ar';

  const getInitials = (name: string | undefined | null) => {
    if (!name || name.trim() === "") return "U";
    const parts = name.trim().split(" ").filter(n => n.length > 0);
    if (parts.length === 0) return "U";
    return parts.map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const hasActiveFilters = filters.status !== "all" || filters.category !== "all";
  const hasSearchQuery = searchQuery.trim().length > 0;
  
  const activeFilterCount = 
    (filters.status !== "all" ? 1 : 0) + 
    (filters.category !== "all" ? 1 : 0);

  const filteredSuggestions = (hasSearchQuery || hasActiveFilters)
    ? issues
        .filter((issue) => {
          const locationStr = formatLocation(issue.latitude, issue.longitude);
          const matchesSearch = !hasSearchQuery ||
            locationStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.title.toLowerCase().includes(searchQuery.toLowerCase());

          const matchesStatus =
            filters.status === "all" || issue.status === filters.status;
          const matchesCategory =
            filters.category === "all" || issue.category === filters.category;

          return matchesSearch && matchesStatus && matchesCategory;
        })
        .sort((a, b) => {
          if (filters.sortBy === "newest") {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          } else {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
        })
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectIssue = (issueId: number) => {
    setShowSuggestions(false);
    setSearchQuery("");
    navigate(`/issue/${issueId}`);
  };

  const handleApplyFilters = () => {
    setFilterPopoverOpen(false);
    setShowSuggestions(true);
  };

  const handleViewAllResults = () => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.category !== "all") params.set("category", filters.category);
    params.set("sort", filters.sortBy);
    setShowSuggestions(false);
    navigate(`/issues?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setFilters({ status: "all", category: "all", sortBy: "newest" });
    setShowSuggestions(false);
  };

  return (
    <header className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 pb-8 rounded-b-3xl">
      <div className={`flex items-start justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏛️</span>
            </span>
            {t('common.appName')}
          </h1>
          <p className="text-primary-foreground/70 text-sm mt-1">{t('common.tagline')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <LanguageSelector />
          
          {isAuthenticated && profile ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2">
                  <Avatar className="h-10 w-10 border-2 border-white/30 cursor-pointer hover:border-white/60 transition-colors">
                    <AvatarFallback className="bg-white/20 text-white font-semibold">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-3">
                  <div className="border-b border-border pb-3">
                    <p className="font-semibold text-foreground">{profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full capitalize">
                      {profile.role}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      signOut();
                      navigate("/auth");
                    }}
                  >
                    <LogOut className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                    {t('common.signOut')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Link to="/auth">
              <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <User className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('common.signIn')}
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {showSearch && (
        <div className="relative flex items-center gap-3" ref={searchRef}>
          <div className="flex-1 relative">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10`} />
            <Input 
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-white text-foreground rounded-xl border-0 shadow-lg`}
            />
            
            {showSuggestions && (hasSearchQuery || hasActiveFilters) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50">
                {/* Active filters bar */}
                {hasActiveFilters && (
                  <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{t('filters.title')}:</span>
                      {filters.status !== "all" && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full capitalize">
                          {t(`dashboard.${filters.status === 'under_review' ? 'underReview' : filters.status === 'under_maintenance' ? 'underMaintenance' : 'resolved'}`)}
                        </span>
                      )}
                      {filters.category !== "all" && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {t(`categories.${filters.category.toLowerCase().replace(' ', '')}`)}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={handleClearFilters}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      {t('common.clear')}
                    </button>
                  </div>
                )}

                {/* Results */}
                {filteredSuggestions.length > 0 ? (
                  <>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredSuggestions.slice(0, 5).map((issue) => (
                        <button
                          key={issue.id}
                          onClick={() => handleSelectIssue(issue.id)}
                          className={`w-full px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} hover:bg-muted transition-colors flex items-center gap-3 border-b border-border last:border-b-0`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
                            {categoryIcons[issue.category] || "📋"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {issue.title || issue.category}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatLocation(issue.latitude, issue.longitude)}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                              issue.status === "under_review"
                                ? "bg-orange-100 text-orange-700"
                                : issue.status === "under_maintenance"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {t(`dashboard.${issue.status === 'under_review' ? 'underReview' : issue.status === 'under_maintenance' ? 'underMaintenance' : 'resolved'}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                    {/* View All Results button */}
                    <button
                      onClick={handleViewAllResults}
                      className="w-full px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted transition-colors border-t border-border"
                    >
                      {t('common.viewAll')} {filteredSuggestions.length} {t('common.results')} →
                    </button>
                  </>
                ) : (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      {t('common.noResults')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="p-3 bg-white rounded-xl shadow-lg hover:bg-muted transition-colors relative">
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t('filters.title')}</h3>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('filters.status')}</Label>
                  <RadioGroup
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="all" id="status-all" />
                      <Label htmlFor="status-all" className="text-sm">{t('filters.all')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="under_review" id="status-under-review" />
                      <Label htmlFor="status-under-review" className="text-sm">{t('dashboard.underReview')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="under_maintenance" id="status-under-maintenance" />
                      <Label htmlFor="status-under-maintenance" className="text-sm">{t('dashboard.underMaintenance')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="resolved" id="status-resolved" />
                      <Label htmlFor="status-resolved" className="text-sm">{t('dashboard.resolved')}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('filters.category')}</Label>
                  <RadioGroup
                    value={filters.category}
                    onValueChange={(value) => setFilters({ ...filters, category: value })}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="all" id="cat-all" />
                      <Label htmlFor="cat-all" className="text-sm">{t('filters.all')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Pothole" id="cat-pothole" />
                      <Label htmlFor="cat-pothole" className="text-sm">{t('categories.pothole')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Garbage" id="cat-garbage" />
                      <Label htmlFor="cat-garbage" className="text-sm">{t('categories.garbage')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Water Leak" id="cat-water" />
                      <Label htmlFor="cat-water" className="text-sm">{t('categories.waterLeak')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Lighting" id="cat-lighting" />
                      <Label htmlFor="cat-lighting" className="text-sm">{t('categories.lighting')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Traffic" id="cat-traffic" />
                      <Label htmlFor="cat-traffic" className="text-sm">{t('categories.traffic')}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('filters.sortBy')}</Label>
                  <RadioGroup
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="newest" id="sort-newest" />
                      <Label htmlFor="sort-newest" className="text-sm">{t('filters.newestFirst')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="oldest" id="sort-oldest" />
                      <Label htmlFor="sort-oldest" className="text-sm">{t('filters.oldestFirst')}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-2">
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      onClick={handleClearFilters}
                      className="flex-1"
                    >
                      {t('filters.clearFilters')}
                    </Button>
                  )}
                  <Button onClick={handleApplyFilters} className="flex-1">
                    {t('filters.applyFilters')}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </header>
  );
};

export default Header;

import { Search, SlidersHorizontal, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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

const Header = ({ onFilter, showSearch = true }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    category: "all",
    sortBy: "newest",
  });
  const navigate = useNavigate();
  const { issues } = useIssues();
  const { user, isAuthenticated, signOut } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const hasActiveFilters = filters.status !== "all" || filters.category !== "all";
  const hasSearchQuery = searchQuery.trim().length > 0;

  const filteredSuggestions = (hasSearchQuery || hasActiveFilters)
    ? issues
        .filter((issue) => {
          // Text search (only apply if there's a search query)
          const matchesSearch = !hasSearchQuery ||
            issue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchQuery.toLowerCase());

          // Filter conditions
          const matchesStatus =
            filters.status === "all" || issue.status === filters.status;
          const matchesCategory =
            filters.category === "all" || issue.category === filters.category;

          return matchesSearch && matchesStatus && matchesCategory;
        })
        .sort((a, b) => {
          if (filters.sortBy === "newest") {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          } else {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
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

  const handleSelectIssue = (issueId: string) => {
    setShowSuggestions(false);
    setSearchQuery("");
    navigate(`/issue/${issueId}`);
  };

  const handleApplyFilters = () => {
    if (onFilter) {
      onFilter(filters);
    } else {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.category !== "all") params.set("category", filters.category);
      params.set("sort", filters.sortBy);
      navigate(`/issues?${params.toString()}`);
    }
  };

  return (
    <header className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 pb-8 rounded-b-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">CityReport</h1>
          <p className="text-blue-100 text-sm">Make your city better</p>
        </div>
        
        {isAuthenticated && user ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2">
                <Avatar className="h-10 w-10 border-2 border-white/30 cursor-pointer hover:border-white/60 transition-colors">
                  <AvatarFallback className="bg-white/20 text-white font-semibold">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-3">
                <div className="border-b border-border pb-3">
                  <p className="font-semibold text-foreground">{user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full capitalize">
                    {user.role}
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
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Link to="/auth">
            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </Link>
        )}
      </div>
      
      {showSearch && (
        <div className="relative flex items-center gap-3" ref={searchRef}>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <Input 
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-12 pr-4 py-3 bg-white text-foreground rounded-xl border-0 shadow-lg"
            />
            
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50 max-h-64 overflow-y-auto">
                {filteredSuggestions.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue.id)}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-b border-border last:border-b-0"
                  >
                    <img
                      src={issue.thumbnail}
                      alt={issue.category}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {issue.category}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {issue.location}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        issue.status === "pending"
                          ? "bg-orange-100 text-orange-700"
                          : issue.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {issue.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            {showSuggestions && (hasSearchQuery || hasActiveFilters) && filteredSuggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border p-4 z-50">
                <p className="text-sm text-muted-foreground text-center">
                  No issues found
                </p>
              </div>
            )}
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition-colors">
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Filter Issues</h3>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <RadioGroup
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="status-all" />
                      <Label htmlFor="status-all" className="text-sm">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pending" id="status-pending" />
                      <Label htmlFor="status-pending" className="text-sm">Pending</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="in-progress" id="status-in-progress" />
                      <Label htmlFor="status-in-progress" className="text-sm">In Progress</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="resolved" id="status-resolved" />
                      <Label htmlFor="status-resolved" className="text-sm">Resolved</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <RadioGroup
                    value={filters.category}
                    onValueChange={(value) => setFilters({ ...filters, category: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="cat-all" />
                      <Label htmlFor="cat-all" className="text-sm">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Pothole" id="cat-pothole" />
                      <Label htmlFor="cat-pothole" className="text-sm">Pothole</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Garbage" id="cat-garbage" />
                      <Label htmlFor="cat-garbage" className="text-sm">Garbage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Water Leak" id="cat-water" />
                      <Label htmlFor="cat-water" className="text-sm">Water Leak</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Lighting" id="cat-lighting" />
                      <Label htmlFor="cat-lighting" className="text-sm">Lighting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Traffic" id="cat-traffic" />
                      <Label htmlFor="cat-traffic" className="text-sm">Traffic</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <RadioGroup
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="newest" id="sort-newest" />
                      <Label htmlFor="sort-newest" className="text-sm">Newest First</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="oldest" id="sort-oldest" />
                      <Label htmlFor="sort-oldest" className="text-sm">Oldest First</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button onClick={() => { handleApplyFilters(); setShowSuggestions(true); }} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </header>
  );
};

export default Header;

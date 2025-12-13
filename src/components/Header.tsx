import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

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

const Header = ({ onSearch, onFilter, showSearch = true }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    category: "all",
    sortBy: "newest",
  });
  const navigate = useNavigate();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    } else if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    }
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
      </div>
      
      {showSearch && (
        <div className="relative flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white text-foreground rounded-xl border-0 shadow-lg"
            />
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

                <Button onClick={handleApplyFilters} className="w-full">
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

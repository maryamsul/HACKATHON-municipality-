import { Search, SlidersHorizontal, User } from "lucide-react";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 pb-8 rounded-b-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">CityReport</h1>
          <p className="text-blue-100 text-sm">Make your city better</p>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <User className="w-6 h-6" />
        </button>
      </div>
      
      <div className="relative flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search issues..."
            className="w-full pl-12 pr-4 py-3 bg-white text-foreground rounded-xl border-0 shadow-lg"
          />
        </div>
        <button className="p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition-colors">
          <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};

export default Header;

import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import CategoryItem from "@/components/CategoryItem";
import BottomNav from "@/components/BottomNav";
import { Circle, Trash2, Droplets, Lightbulb, TrafficCone, FileText } from "lucide-react";

const Index = () => {
  const stats = [
    { count: 12, label: "Pending", color: "orange" as const },
    { count: 8, label: "In Progress", color: "blue" as const },
    { count: 45, label: "Resolved", color: "green" as const },
  ];

  const categories = [
    { icon: Circle, label: "Pothole", iconColor: "text-blue-700", iconBgColor: "bg-blue-100" },
    { icon: Trash2, label: "Garbage", iconColor: "text-amber-600", iconBgColor: "bg-amber-50" },
    { icon: Droplets, label: "Water Leak", iconColor: "text-cyan-500", iconBgColor: "bg-cyan-50" },
    { icon: Lightbulb, label: "Lighting", iconColor: "text-yellow-500", iconBgColor: "bg-yellow-50" },
    { icon: TrafficCone, label: "Traffic", iconColor: "text-red-500", iconBgColor: "bg-red-50" },
    { icon: FileText, label: "Other", iconColor: "text-gray-600", iconBgColor: "bg-gray-100" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background pb-24">
      <Header />
      
      {/* Stats Section */}
      <section className="px-6 py-6">
        <div className="flex items-center justify-around bg-card rounded-2xl p-4 shadow-sm">
          {stats.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="px-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Categories</h2>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((category) => (
            <CategoryItem key={category.label} {...category} />
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
};

export default Index;

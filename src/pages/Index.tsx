import { motion } from "framer-motion";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import CategoryItem from "@/components/CategoryItem";
import BottomNav from "@/components/BottomNav";
import { useIssues } from "@/context/IssuesContext";
import { Circle, Trash2, Droplets, Lightbulb, TrafficCone, FileText } from "lucide-react";

const Index = () => {
  const { issues } = useIssues();

  const stats = [
    { count: issues.filter(i => i.status === "pending").length, label: "Pending", color: "orange" as const },
    { count: issues.filter(i => i.status === "in-progress").length, label: "In Progress", color: "blue" as const },
    { count: issues.filter(i => i.status === "resolved").length, label: "Resolved", color: "green" as const },
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
      <motion.section 
        className="px-6 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.div 
          className="flex items-center justify-around bg-card rounded-2xl p-4 shadow-sm"
          whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
          transition={{ duration: 0.3 }}
        >
          {stats.map((stat, index) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </motion.div>
      </motion.section>

      {/* Categories Section */}
      <motion.section 
        className="px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.h2 
          className="text-lg font-semibold text-foreground mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          Categories
        </motion.h2>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((category, index) => (
            <CategoryItem key={category.label} {...category} index={index} />
          ))}
        </div>
      </motion.section>

      <BottomNav />
    </div>
  );
};

export default Index;

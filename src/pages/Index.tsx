import { motion } from "framer-motion";
import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import StatsCard from "@/components/StatsCard";
import CategoryItem from "@/components/CategoryItem";
import BottomNav from "@/components/BottomNav";
import { useIssues } from "@/context/IssuesContext";
import { Circle, Trash2, Droplets, Lightbulb, TrafficCone, FileText, Clock, Settings, CheckCircle } from "lucide-react";

const Index = () => {
  const { issues } = useIssues();

  const stats = [
    { 
      count: issues.filter(i => i.status === "pending").length, 
      label: "قيد الانتظار", 
      color: "orange" as const,
      icon: Clock
    },
    { 
      count: issues.filter(i => i.status === "in-progress").length, 
      label: "قيد التنفيذ", 
      color: "blue" as const,
      icon: Settings
    },
    { 
      count: issues.filter(i => i.status === "resolved").length, 
      label: "تم الحل", 
      color: "green" as const,
      icon: CheckCircle
    },
  ];

  const categories = [
    { icon: Circle, label: "حفر", iconColor: "text-blue-700", iconBgColor: "bg-blue-100" },
    { icon: Trash2, label: "نفايات", iconColor: "text-amber-600", iconBgColor: "bg-amber-50" },
    { icon: Droplets, label: "تسرب مياه", iconColor: "text-cyan-500", iconBgColor: "bg-cyan-50" },
    { icon: Lightbulb, label: "إنارة", iconColor: "text-yellow-500", iconBgColor: "bg-yellow-50" },
    { icon: TrafficCone, label: "مرور", iconColor: "text-red-500", iconBgColor: "bg-red-50" },
    { icon: FileText, label: "أخرى", iconColor: "text-gray-600", iconBgColor: "bg-gray-100" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-background pb-24" dir="rtl">
      <Header />
      
      {/* Hero Section with Arabic Text */}
      <motion.section 
        className="px-6 pt-6 pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1 
          className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          شاهد. صوّر. بلّغ.
          <br />
          <span className="text-primary">مدينتك أفضل</span>
        </motion.h1>
        <motion.p 
          className="text-muted-foreground mt-2 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          ساهم في تحسين مدينتك من خلال الإبلاغ عن المشاكل
        </motion.p>
      </motion.section>
      
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Dashboard Section */}
      <motion.section 
        className="px-6 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">لوحة المتابعة</h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex flex-col items-center justify-center gap-2"
              whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
            >
              <div className={`p-3 rounded-xl ${
                stat.color === "orange" ? "bg-orange-100" : 
                stat.color === "blue" ? "bg-blue-100" : "bg-green-100"
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.color === "orange" ? "text-orange-600" : 
                  stat.color === "blue" ? "text-blue-600" : "text-green-600"
                }`} />
              </div>
              <span className={`text-lg font-bold ${
                stat.color === "orange" ? "text-orange-600" : 
                stat.color === "blue" ? "text-blue-600" : "text-green-600"
              }`}>
                {stat.count} {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Categories Section */}
      <motion.section 
        className="px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.h2 
          className="text-lg font-semibold text-foreground mb-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          الفئات
        </motion.h2>
        <div className="grid grid-cols-3 gap-3">
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

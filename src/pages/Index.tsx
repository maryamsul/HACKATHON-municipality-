import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryItem from "@/components/CategoryItem";
import BottomNav from "@/components/BottomNav";
import PremiumMessageRotator from "@/components/PremiumMessageRotator";
import MunicipalitiesShowcase from "@/components/MunicipalitiesShowcase";
import { useIssues } from "@/context/IssuesContext";
import { Circle, Trash2, Droplets, Lightbulb, TrafficCone, FileText, Clock, Wrench, CheckCircle } from "lucide-react";

const Index = () => {
  const { issues } = useIssues();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const stats = [
    { 
      count: issues.filter(i => i.status === "under_review").length, 
      labelKey: "dashboard.underReview", 
      color: "orange" as const,
      icon: Clock
    },
    { 
      count: issues.filter(i => i.status === "under_maintenance").length, 
      labelKey: "dashboard.underMaintenance", 
      color: "blue" as const,
      icon: Wrench
    },
    { 
      count: issues.filter(i => i.status === "resolved").length, 
      labelKey: "dashboard.resolved", 
      color: "green" as const,
      icon: CheckCircle
    },
  ];

  const categories = [
    { icon: Circle, label: "Pothole", labelKey: "categories.pothole", iconColor: "text-blue-700", iconBgColor: "bg-blue-100" },
    { icon: Trash2, label: "Garbage", labelKey: "categories.garbage", iconColor: "text-amber-600", iconBgColor: "bg-amber-50" },
    { icon: Droplets, label: "Water Leak", labelKey: "categories.waterLeak", iconColor: "text-cyan-500", iconBgColor: "bg-cyan-50" },
    { icon: Lightbulb, label: "Lighting", labelKey: "categories.lighting", iconColor: "text-yellow-500", iconBgColor: "bg-yellow-50" },
    { icon: TrafficCone, label: "Traffic", labelKey: "categories.traffic", iconColor: "text-red-500", iconBgColor: "bg-red-50" },
    { icon: FileText, label: "Other", labelKey: "categories.other", iconColor: "text-gray-600", iconBgColor: "bg-gray-100" },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-primary/5 via-background to-accent/10 pb-24`}>
      <Header />
      
      {/* Premium Message Rotator - Between Header and Categories */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PremiumMessageRotator />
      </motion.section>

      {/* Municipalities Showcase - Full width carousel */}
      <MunicipalitiesShowcase />

      {/* Dashboard Section */}
      <motion.section 
        className="px-6 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h2 className={`text-lg font-semibold text-foreground mb-4 ${isRTL ? 'text-right' : ''}`}>
          {t('dashboard.title')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.labelKey}
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
                {stat.count} {t(stat.labelKey)}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Categories Section */}
      <motion.section 
        id="categories-section"
        className="px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.h2 
          className={`text-lg font-semibold text-foreground mb-4 ${isRTL ? 'text-right' : ''}`}
          initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {t('categories.title')}
        </motion.h2>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category, index) => (
            <CategoryItem 
              key={category.label} 
              {...category} 
              displayLabel={t(category.labelKey)}
              index={index} 
            />
          ))}
        </div>
      </motion.section>

      {/* Hero Section - Call to Action at the End */}
      <HeroSection />

      <BottomNav />
    </div>
  );
};

export default Index;

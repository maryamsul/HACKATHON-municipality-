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

  // Using exact DB status values: "Under Review", "Under Maintenance", "Resolved"
  const stats = [
    { 
      count: issues.filter(i => i.status === "Under Review").length, 
      labelKey: "dashboard.underReview", 
      color: "orange" as const,
      icon: Clock
    },
    { 
      count: issues.filter(i => i.status === "Under Maintenance").length, 
      labelKey: "dashboard.underMaintenance", 
      color: "blue" as const,
      icon: Wrench
    },
    { 
      count: issues.filter(i => i.status === "Resolved").length, 
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
      
      <main className="px-4 pt-4 space-y-6">
        {/* Stats Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base text-foreground">{t('dashboard.liveStatus')}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-2xl ${
                  stat.color === 'orange' ? 'bg-orange-50 dark:bg-orange-950/30' :
                  stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-950/30' :
                  'bg-green-50 dark:bg-green-950/30'
                }`}
              >
                <stat.icon className={`w-5 h-5 mb-2 ${
                  stat.color === 'orange' ? 'text-orange-500' :
                  stat.color === 'blue' ? 'text-blue-500' :
                  'text-green-500'
                }`} />
                <div className={`text-2xl font-bold ${
                  stat.color === 'orange' ? 'text-orange-700 dark:text-orange-400' :
                  stat.color === 'blue' ? 'text-blue-700 dark:text-blue-400' :
                  'text-green-700 dark:text-green-400'
                }`}>
                  {stat.count}
                </div>
                <div className={`text-xs ${
                  stat.color === 'orange' ? 'text-orange-600 dark:text-orange-500' :
                  stat.color === 'blue' ? 'text-blue-600 dark:text-blue-500' :
                  'text-green-600 dark:text-green-500'
                }`}>
                  {t(stat.labelKey)}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Hero Section with PremiumMessageRotator integrated */}
        <HeroSection />

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base text-foreground">{t('dashboard.categories')}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category, idx) => (
              <CategoryItem
                key={idx}
                icon={category.icon}
                label={category.label}
                labelKey={category.labelKey}
                iconColor={category.iconColor}
                iconBgColor={category.iconBgColor}
              />
            ))}
          </div>
        </section>

        {/* Municipalities Showcase */}
        <MunicipalitiesShowcase />

        {/* Premium Message Rotator */}
        <PremiumMessageRotator />
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;

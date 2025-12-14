import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StatsCardProps {
  count: number;
  label: string;
  color: "orange" | "blue" | "green";
}

const StatsCard = ({ count, label, color }: StatsCardProps) => {
  const [displayCount, setDisplayCount] = useState(0);

  const colorClasses = {
    orange: "text-orange-500",
    blue: "text-blue-500",
    green: "text-green-600",
  };

  // Count-up animation
  useEffect(() => {
    if (count === 0) {
      setDisplayCount(0);
      return;
    }

    const duration = 1000;
    const steps = 20;
    const increment = count / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        setDisplayCount(count);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [count]);

  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.span 
        className={`text-2xl font-bold ${colorClasses[color]}`}
        key={displayCount}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500 }}
      >
        {displayCount}
      </motion.span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </motion.div>
  );
};

export default StatsCard;

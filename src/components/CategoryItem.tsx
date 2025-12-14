import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface CategoryItemProps {
  icon: LucideIcon;
  label: string;
  iconColor?: string;
  iconBgColor?: string;
  index?: number;
}

const CategoryItem = ({ 
  icon: Icon, 
  label, 
  iconColor = "text-blue-600", 
  iconBgColor = "bg-blue-100",
  index = 0 
}: CategoryItemProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/category/${encodeURIComponent(label)}`);
  };

  return (
    <motion.button 
      onClick={handleClick}
      className="flex flex-col items-center gap-2 p-4 hover:bg-accent rounded-xl transition-colors relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.08,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Ripple effect container */}
      <motion.div 
        className={`w-14 h-14 ${iconBgColor} rounded-2xl flex items-center justify-center relative`}
        whileHover={{ 
          boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
        }}
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.2
        }}
      >
        <motion.div
          className={`w-7 h-7 ${iconColor}`}
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.15
          }}
        >
          <Icon className="w-full h-full" />
        </motion.div>
      </motion.div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </motion.button>
  );
};

export default CategoryItem;

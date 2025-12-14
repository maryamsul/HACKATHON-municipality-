import { motion } from "framer-motion";
import { Building2, Home, Building, Church, Factory } from "lucide-react";

const LoadingScreen = () => {
  const buildings = [
    { Icon: Home, height: "h-12", delay: 0 },
    { Icon: Building2, height: "h-20", delay: 0.1 },
    { Icon: Building, height: "h-16", delay: 0.2 },
    { Icon: Church, height: "h-14", delay: 0.3 },
    { Icon: Factory, height: "h-18", delay: 0.4 },
  ];

  return (
    <motion.div 
      className="fixed inset-0 bg-gradient-to-b from-amber-50 to-background flex flex-col items-center justify-center z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* City skyline */}
      <div className="flex items-end gap-1 mb-8">
        {buildings.map(({ Icon, height, delay }, index) => (
          <motion.div
            key={index}
            className={`${height} flex items-end`}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{
              delay,
              duration: 0.5,
              ease: "easeOut"
            }}
            style={{ originY: 1 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                delay: delay + 0.5,
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Icon className="w-8 h-8 text-primary" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* App name */}
      <motion.h1
        className="text-2xl font-bold text-primary mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        CityReport
      </motion.h1>

      {/* Loading dots */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default LoadingScreen;

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
}

const SuccessAnimation = ({ show, message = "Success!", onComplete }: SuccessAnimationProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            setTimeout(() => onComplete?.(), 1500);
          }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Checkmark with draw animation */}
            <motion.div
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 bg-green-500/30 rounded-full blur-xl"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: [0, 1, 0] }}
                transition={{ duration: 1, delay: 0.3 }}
              />
              
              {/* Checkmark icon */}
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <CheckCircle2 className="w-20 h-20 text-green-500" strokeWidth={2} />
              </motion.div>

              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ delay: 0.5, duration: 0.6 }}
              />
            </motion.div>

            {/* Message */}
            <motion.p
              className="text-xl font-semibold text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {message}
            </motion.p>

            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${50 + (Math.random() - 0.5) * 40}%`,
                    top: "50%",
                    backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6'][i % 5],
                  }}
                  initial={{ scale: 0, y: 0, x: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    y: [0, (Math.random() - 0.5) * 200],
                    x: [(Math.random() - 0.5) * 200],
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.4 + Math.random() * 0.3,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAnimation;

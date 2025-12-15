import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import beirutImg from "@/assets/municipalities/beirut.jpg";
import hazmiehImg from "@/assets/municipalities/hazmieh.gif";
import saidaImg from "@/assets/municipalities/saida.png";
import sourImg from "@/assets/municipalities/sour.jpg";
import tripoliImg from "@/assets/municipalities/tripoli.jpg";
import zahleImg from "@/assets/municipalities/zahle.jpg";

const municipalities = [
  { name: "بيروت", nameEn: "Beirut", image: beirutImg },
  { name: "الحازمية", nameEn: "Hazmieh", image: hazmiehImg },
  { name: "صيدا", nameEn: "Saida", image: saidaImg },
  { name: "صور", nameEn: "Sour", image: sourImg },
  { name: "طرابلس", nameEn: "Tripoli", image: tripoliImg },
  { name: "زحلة", nameEn: "Zahle", image: zahleImg },
];

const MunicipalitiesShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % municipalities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.section
      className="relative w-full h-48 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            src={municipalities[currentIndex].image}
            alt={municipalities[currentIndex].nameEn}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white font-bold text-lg">{municipalities[currentIndex].name}</p>
            <p className="text-white/80 text-sm">{municipalities[currentIndex].nameEn}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {municipalities.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "bg-white w-4" 
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default MunicipalitiesShowcase;

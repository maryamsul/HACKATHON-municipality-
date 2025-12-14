import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import lebImage from "@/assets/leb.webp";
import beImage from "@/assets/be.jpg";
import tripoliImage from "@/assets/tripoli-municipality.jpg";

const images = [
  { src: lebImage, alt: "Beirut Cityscape" },
  { src: beImage, alt: "Beirut Downtown" },
  { src: tripoliImage, alt: "Tripoli Municipality" },
];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full">
      {/* Carousel Container */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden rounded-xl mx-4 mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <motion.img
              src={images[currentIndex].src}
              alt={images[currentIndex].alt}
              className="w-full h-full object-cover rounded-xl cursor-pointer"
              whileHover={{ scale: 1.05, opacity: 0.9 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Dots Indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Line underneath */}
      <div className="mx-4 mt-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </div>
  );
};

export default HeroCarousel;

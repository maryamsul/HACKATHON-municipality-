import { motion } from "framer-motion";

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
  return (
    <motion.section
      className="px-6 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <h2 className="text-lg font-semibold text-foreground mb-4 text-center">
        البلديات الشريكة
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Partner Municipalities
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {municipalities.map((municipality, index) => (
          <motion.div
            key={municipality.nameEn}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative group overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <img
                src={municipality.image}
                alt={municipality.nameEn}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
              <p className="text-white font-semibold text-sm">{municipality.name}</p>
              <p className="text-white/80 text-xs">{municipality.nameEn}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default MunicipalitiesShowcase;

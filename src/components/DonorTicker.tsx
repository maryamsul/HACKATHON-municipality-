import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  municipality: string;
  purpose: string;
  location?: string;
}

// Mock data - replace with real database fetch when ready
const mockDonations: Donation[] = [
  {
    id: "1",
    donor_name: "Kassem",
    amount: 2000,
    municipality: "Beirut Municipality",
    purpose: "pothole maintenance",
    location: "Street 123",
  },
  {
    id: "2",
    donor_name: "Ghadir",
    amount: 1000,
    municipality: "Beirut Municipality",
    purpose: "lighting maintenance",
    location: "Street 45",
  },
  {
    id: "3",
    donor_name: "Mariam",
    amount: 500,
    municipality: "Beirut Municipality",
    purpose: "park cleanup",
    location: "Central Park",
  },
  {
    id: "4",
    donor_name: "Ahmad",
    amount: 750,
    municipality: "Tripoli Municipality",
    purpose: "street repairs",
    location: "Main Boulevard",
  },
  {
    id: "5",
    donor_name: "Layla",
    amount: 1500,
    municipality: "Saida Municipality",
    purpose: "water infrastructure",
    location: "Downtown District",
  },
];

const DonorTicker = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [donations] = useState<Donation[]>(mockDonations);

  useEffect(() => {
    if (donations.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % donations.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [donations.length]);

  if (donations.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <Heart className="inline-block w-4 h-4 mr-2 text-primary" />
        Be the first donor to support city improvements!
      </div>
    );
  }

  const currentDonation = donations[currentIndex];

  const formatMessage = (donation: Donation) => {
    const locationText = donation.location ? ` on ${donation.location}` : "";
    return (
      <>
        <span className="font-bold text-primary">{donation.donor_name}</span>
        {" donated "}
        <span className="font-bold text-primary">${donation.amount.toLocaleString()}</span>
        {" to "}
        <span className="font-medium">{donation.municipality}</span>
        {" for "}
        <span className="italic">{donation.purpose}</span>
        {locationText}.
      </>
    );
  };

  return (
    <div className="relative overflow-hidden py-3 px-4">
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm sm:text-base text-muted-foreground">
        <Heart className="w-4 h-4 text-primary flex-shrink-0 animate-pulse" />
        <span className="text-foreground font-medium">Thanks to our donors:</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentDonation.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="inline"
          >
            {formatMessage(currentDonation)}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DonorTicker;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Heart, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  municipality: string;
  purpose: string;
  location?: string;
  created_at: string;
}

// Mock data - will be replaced with real database fetch
const mockDonations: Donation[] = [
  {
    id: "1",
    donor_name: "Kassem",
    amount: 2000,
    municipality: "Beirut Municipality",
    purpose: "pothole maintenance",
    location: "Street 123",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    donor_name: "Ghadir",
    amount: 1000,
    municipality: "Beirut Municipality",
    purpose: "lighting maintenance",
    location: "Street 45",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    donor_name: "Mariam",
    amount: 500,
    municipality: "Beirut Municipality",
    purpose: "park cleanup",
    location: "Central Park",
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    donor_name: "Ahmad",
    amount: 750,
    municipality: "Tripoli Municipality",
    purpose: "street repairs",
    location: "Main Boulevard",
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    donor_name: "Layla",
    amount: 1500,
    municipality: "Saida Municipality",
    purpose: "water infrastructure",
    location: "Downtown District",
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    donor_name: "Omar",
    amount: 3000,
    municipality: "Zahle Municipality",
    purpose: "road paving",
    location: "Highway 1",
    created_at: new Date().toISOString(),
  },
  {
    id: "7",
    donor_name: "Fatima",
    amount: 800,
    municipality: "Sour Municipality",
    purpose: "garbage collection",
    location: "Beach Road",
    created_at: new Date().toISOString(),
  },
];

const Donors = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [donations, setDonations] = useState<Donation[]>(mockDonations);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredDonations = donations.filter(
    (donation) =>
      donation.donor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.municipality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-4 py-6 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Heart className="w-5 h-5" />
              {t('donors.title')}
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              {donations.length} {t('donors.totalDonors')} • ${totalDonations.toLocaleString()} {t('donors.raised')}
            </p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/60`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('donors.searchPlaceholder')}
            className={`${isRTL ? 'pr-10' : 'pl-10'} bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60`}
          />
        </div>
      </header>

      {/* Donors List */}
      <main className="p-4 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>
        ) : filteredDonations.length > 0 ? (
          filteredDonations.map((donation, index) => (
            <motion.div
              key={donation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl p-4 shadow-sm border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{donation.donor_name}</h3>
                    <span className="text-lg font-bold text-primary">${donation.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('donors.donatedTo')} {donation.municipality}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('donors.for')} {donation.purpose}
                    {donation.location && ` • ${donation.location}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(donation.created_at).toLocaleDateString(
                      i18n.language === 'ar' ? 'ar-LB' : i18n.language === 'fr' ? 'fr-FR' : 'en-US'
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>{t('donors.noDonors')}</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Donors;

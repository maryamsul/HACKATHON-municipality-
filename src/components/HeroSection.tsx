import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, FileCheck, ThumbsUp, Headphones, X, QrCode, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import DonorTicker from "@/components/DonorTicker";
import qrCode from "@/assets/qr.jpeg";

const DONATION_LINK = "https://whish.money/invoice/pay/?q=BI6PCagnO";

const HeroSection = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const stats = [
    { icon: FileCheck, value: "5K+", label: t('hero.activeReports') },
    { icon: ThumbsUp, value: "98%", label: t('hero.satisfactionRate') },
    { icon: Headphones, value: "24/7", label: t('hero.supportAvailable') },
  ];

  return (
    <section className="relative overflow-hidden px-6 py-12 sm:py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <motion.div
          className={`absolute -top-32 ${isRTL ? '-left-32' : '-right-32'} w-96 h-96 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute -bottom-32 ${isRTL ? '-right-32' : '-left-32'} w-80 h-80 rounded-full bg-gradient-to-tr from-accent/30 to-primary/20 blur-3xl`}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Floating circles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-primary/20"
            style={{
              width: `${60 + i * 20}px`,
              height: `${60 + i * 20}px`,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center">

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
        >
          {t('hero.joinMovement')}{" "}
          <span className="relative">
            <span className="relative z-10 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {t('hero.movement')}
            </span>
            <motion.span
              className="absolute bottom-2 left-0 right-0 h-3 bg-primary/20 rounded-full -z-0"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            />
          </span>
        </motion.h1>

        {/* Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed"
        >
          {t('hero.heroDescription')}
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="group w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t('hero.getStarted')}
            <ArrowRight className={`${isRTL ? 'mr-2 group-hover:-translate-x-1' : 'ml-2 group-hover:translate-x-1'} w-5 h-5 transition-transform`} />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto border-2 border-primary/30 text-primary hover:bg-primary/10 px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300"
          >
            {t('hero.learnMore')}
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Ready to Make a Difference Button - directly above donors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 pt-6 border-t border-border/30 flex justify-center"
        >
          <div className="relative inline-block" ref={dropdownRef}>
            <motion.button
              onClick={() => setShowDropdown(!showDropdown)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-destructive hover:bg-destructive/90 border border-destructive cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-destructive/25"
            >
              <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" />
              <span className="text-base font-bold text-destructive-foreground">{t('hero.readyToMakeDifference')}</span>
            </motion.button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowQRModal(true);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} hover:bg-muted transition-colors`}
                >
                  <QrCode className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{t('hero.scanQrCode')}</p>
                    <p className="text-xs text-muted-foreground">{t('hero.usePhoneCamera')}</p>
                  </div>
                </button>
                <div className="border-t border-border" />
                <a
                  href={DONATION_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowDropdown(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} hover:bg-muted transition-colors`}
                >
                  <ExternalLink className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{t('hero.openDonationLink')}</p>
                    <p className="text-xs text-muted-foreground">{t('hero.directPaymentPage')}</p>
                  </div>
                </a>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Donor Ticker - at the bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6"
        >
          <DonorTicker />
        </motion.div>

      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowQRModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative bg-card rounded-2xl p-6 shadow-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQRModal(false)}
              className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} p-2 rounded-full hover:bg-muted transition-colors`}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4 text-center">{t('hero.scanToDonate')}</h3>
            <div className="bg-white rounded-xl p-4">
              <img src={qrCode} alt="Donation QR Code" className="w-full h-auto rounded-lg" />
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              {t('hero.scanQrDescription')}
            </p>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default HeroSection;

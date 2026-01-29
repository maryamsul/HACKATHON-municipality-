import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Camera, MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useIssues } from "@/context/IssuesContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { parseLatLngFromString } from "@/lib/geo";
import BottomNav from "../components/BottomNav";
import SuccessAnimation from "@/components/SuccessAnimation";

const AddIssue = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const { refetchIssues } = useIssues();
  const { user, profile, isAuthenticated, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category keys for translation
  const categoryKeys = [
    { key: "pothole", label: "Pothole" },
    { key: "garbage", label: "Garbage" },
    { key: "waterLeak", label: "Water Leak" },
    { key: "lighting", label: "Lighting" },
    { key: "traffic", label: "Traffic" },
    { key: "other", label: "Other" },
  ];

  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // If the user pastes/types "lat, lng" into the location input, derive coordinates.
  // This avoids regressions where coordinates are visually present but `coordinates` state is null.
  useEffect(() => {
    const parsed = parseLatLngFromString(location);
    if (!parsed) return;

    setCoordinates((prev) => {
      if (!prev) return parsed;
      // Avoid churn if the values are effectively the same.
      const sameLat = Math.abs(prev.lat - parsed.lat) < 1e-6;
      const sameLng = Math.abs(prev.lng - parsed.lng) < 1e-6;
      return sameLat && sameLng ? prev : parsed;
    });
  }, [location]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('addIssue.authRequired'),
        description: t('addIssue.pleaseSignIn'),
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [isAuthenticated, isLoading, navigate, toast, t]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && profile && profile.role !== "citizen") {
      toast({
        title: t('addIssue.accessDenied'),
        description: t('addIssue.onlyCitizens'),
        variant: "destructive",
      });
      navigate("/");
    }
  }, [profile, isAuthenticated, isLoading, navigate, toast, t]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      setPhotoFile(file);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: t('addIssue.geolocationNotSupported'),
        description: t('addIssue.browserNoSupport'),
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setIsGettingLocation(false);
        toast({
          title: t('addIssue.locationFound'),
          description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let message = t('addIssue.unableToGetLocation');
        if (error.code === error.PERMISSION_DENIED) {
          message = t('addIssue.locationPermissionDenied');
        }
        toast({
          title: t('addIssue.locationError'),
          description: message,
          variant: "destructive",
        });
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const effectiveCoordinates = coordinates ?? parseLatLngFromString(location);

    if (!category || !description || !effectiveCoordinates) {
      toast({
        title: t('addIssue.missingFields'),
        description: t('addIssue.pleaseFillRequired'),
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: t('addIssue.notAuthenticated'),
        description: t('addIssue.pleaseSignInSubmit'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      let thumbnailUrl: string | null = null;

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `issue-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('issues')
          .upload(filePath, photoFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('issues')
            .getPublicUrl(filePath);
          thumbnailUrl = urlData.publicUrl;
        }
      }

      // Insert into issues table only
      const { error } = await supabase.from("issues").insert({
        title: `${category} issue`,
        description,
        category,
        latitude: effectiveCoordinates.lat,
        longitude: effectiveCoordinates.lng,
        reported_by: user.id,
        status: "pending",
        thumbnail: thumbnailUrl,
      });

      if (error) {
        throw error;
      }

      await refetchIssues();
      
      setShowSuccess(true);
    } catch (error) {
      console.error("Error creating issue:", error);

      // Supabase errors often include useful `details`/`hint` fields.
      const extra =
        error && typeof error === "object"
          ? [
              (error as { details?: string }).details,
              (error as { hint?: string }).hint,
            ]
              .filter(Boolean)
              .join(" • ")
          : "";

      toast({
        title: t('common.error'),
        description:
          error instanceof Error
            ? `${error.message}${extra ? ` — ${extra}` : ""}`
            : t('addIssue.errorCreatingIssue'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (showSuccess) {
    return <SuccessAnimation show={showSuccess} onComplete={handleSuccessComplete} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('addIssue.title')}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Photo Upload */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t('addIssue.photo')}</label>
          <div
            onClick={handlePhotoClick}
            className="relative h-48 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Camera className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">{t('addIssue.tapToAddPhoto')}</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        </motion.div>

        {/* Category Select */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-foreground">{t('addIssue.category')}</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder={t('addIssue.selectCategory')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              {categoryKeys.map((cat) => (
                <SelectItem key={cat.label} value={cat.label}>
                  {t(`categories.${cat.key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-foreground">{t('addIssue.location')}</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('addIssue.locationPlaceholder')}
                className={isRTL ? 'pr-9' : 'pl-9'}
                dir="ltr"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleGetLocation}
              disabled={isGettingLocation}
            >
              <Navigation className={`h-4 w-4 ${isGettingLocation ? "animate-pulse" : ""}`} />
            </Button>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-foreground">{t('addIssue.description')}</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('addIssue.descriptionPlaceholder')}
            rows={4}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('addIssue.submitting') : t('addIssue.submit')}
          </Button>
        </motion.div>
      </form>

      <BottomNav />
    </div>
  );
};

export default AddIssue;

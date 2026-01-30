import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Camera, MapPin, Navigation, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useBuildings } from "@/context/BuildingsContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createBuildingReport } from "@/api/buildingApi";
import SuccessAnimation from "@/components/SuccessAnimation";

interface AddBuildingAtRiskFormProps {
  onClose: () => void;
}

const AddBuildingAtRiskForm = ({ onClose }: AddBuildingAtRiskFormProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const { refetchBuildings } = useBuildings();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [buildingName, setBuildingName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Parse coordinates from manual input (supports "lat, lng" format)
  const parseCoordinatesFromInput = (input: string): { lat: number; lng: number } | null => {
    const cleaned = input.trim();
    // Match patterns like "33.8938, 35.5018" or "33.8938,35.5018"
    const match = cleaned.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    // Try to parse coordinates from manual input
    const parsed = parseCoordinatesFromInput(value);
    if (parsed) {
      setCoordinates(parsed);
    }
  };

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
        setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
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

    if (!buildingName.trim() || !description.trim()) {
      toast({
        title: t('addIssue.missingFields'),
        description: t('buildings.pleaseFillRequired'),
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
      return;
    }

    setIsSubmitting(true);

    try {
      let thumbnailUrl: string | null = null;

      // Upload photo if provided (use same path pattern as Issues)
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop() || "jpg";
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `issue-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("issues")
          .upload(filePath, photoFile);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("issues")
            .getPublicUrl(filePath);
          thumbnailUrl = publicUrlData.publicUrl;
        }
      }

      // Use the API function for consistent field mapping
      const result = await createBuildingReport({
        title: buildingName.trim(),
        description: description.trim(),
        reportedBy: user.id,
        assignedTo: null,
        latitude: coordinates?.lat ?? null,
        longitude: coordinates?.lng ?? null,
        thumbnail: thumbnailUrl,
      });

      if (!result.success) {
        console.error("API error:", result.error, result.details);
        throw new Error(result.details ? `${result.error}: ${result.details}` : result.error);
      }

      await refetchBuildings();
      setShowSuccess(true);
    } catch (error) {
      console.error("Error creating building report:", error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('buildings.errorCreating'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    onClose();
  };

  if (showSuccess) {
    return <SuccessAnimation show={showSuccess} onComplete={handleSuccessComplete} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold">{t('buildings.reportTitle')}</h1>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-8">
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

        {/* Building Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-foreground">{t('buildings.buildingName')} *</label>
          <Input
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            placeholder={t('buildings.buildingNamePlaceholder')}
            required
          />
        </motion.div>

        {/* Address / Location */}
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
                value={address}
                onChange={handleAddressChange}
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
          <label className="text-sm font-medium text-foreground">{t('addIssue.description')} *</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('buildings.descriptionPlaceholder')}
            rows={4}
            required
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button type="submit" variant="destructive" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('addIssue.submitting') : t('buildings.submitReport')}
          </Button>
        </motion.div>
      </form>
    </div>
  );
};

export default AddBuildingAtRiskForm;

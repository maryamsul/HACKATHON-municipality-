import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useIssues } from "@/context/IssuesContext";
import BottomNav from "../components/BottomNav";
import SuccessAnimation from "@/components/SuccessAnimation";

// Define the categories for the issues
const categories = ["Pothole", "Garbage", "Water Leak", "Lighting", "Traffic", "Other"];

const API_URL = "https://ypgoodjdxcnjysrsortp.supabase.co/functions/v1/api/issues";
const SUPABASE_ANON_KEY = "sb_publishable_rs58HjDUbtkp9QvD7Li4VA_fqtAUF2u";

const AddIssue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addIssue } = useIssues();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      setThumbnail(previewUrl);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation",
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
          title: "Location found",
          description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Unable to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enable it in your browser settings.";
        }
        toast({
          title: "Location error",
          description: message,
          variant: "destructive",
        });
      },
    );
  };

  const createIssue = async (issueData: {
    title: string;
    description: string;
    category: string;
    reportedBy: string;
    location: string;
    latitude: number;
    longitude: number;
    thumbnail: string;
  }) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        throw new Error("Failed to create issue");
      }

      const data = await response.json(); // Get the response
      return data; // You can use this response in the frontend
    } catch (error) {
      console.error("Error creating issue:", error);
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !description || !coordinates) {
      toast({
        title: "Missing fields",
        description: "Please select category, description, and location",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createIssue({
        title: `${category} issue`,
        description,
        category,
        reportedBy: "anonymous",
        location,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        thumbnail: thumbnail || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
      });

      addIssue({
        category,
        location,
        description,
        thumbnail: thumbnail || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
        coordinates,
      });

      setShowSuccess(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while creating the issue.",
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

  if (showSuccess) {
    return <SuccessAnimation show={showSuccess} onComplete={handleSuccessComplete} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Report Issue</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Photo Upload */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <label className="text-sm font-medium text-foreground">Photo</label>
          <div
            onClick={handlePhotoClick}
            className="relative h-48 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Camera className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Tap to add photo</p>
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
          <label className="text-sm font-medium text-foreground">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
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
          <label className="text-sm font-medium text-foreground">Location</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location or use GPS"
                className="pl-9"
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
          <label className="text-sm font-medium text-foreground">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue..."
            rows={4}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </motion.div>
      </form>

      <BottomNav />
    </div>
  );
};

export default AddIssue;

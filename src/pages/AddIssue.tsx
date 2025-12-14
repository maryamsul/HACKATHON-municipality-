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
import { createIssue } from "@/services/issues";
import BottomNav from "@/components/BottomNav";
import SuccessAnimation from "@/components/SuccessAnimation";

const categories = ["Pothole", "Garbage", "Water Leak", "Lighting", "Traffic", "Other"];

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
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
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
        coordinates,
        thumbnail: thumbnail || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
      });

      addIssue({
        category,
        location,
        description,
        thumbnail: thumbnail || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
        coordinates,
      });

      setIsSubmitting(false);
      setShowSuccess(true);
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Error submitting issue",
        description: error instanceof Error ? error.message : "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    navigate("/issues");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SuccessAnimation show={showSuccess} message="Issue Reported!" onComplete={handleSuccessComplete} />

      <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />

      <motion.header
        className="bg-primary text-primary-foreground p-4"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Report New Issue</h1>
        </div>
      </motion.header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Category */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location */}
        <div className="flex gap-2">
          <Input value={location} readOnly={!!coordinates} placeholder="Detect location" className="pl-10" />
          <Button type="button" variant="outline" onClick={handleGetLocation} disabled={isGettingLocation}>
            <Navigation />
          </Button>
        </div>

        {/* Description */}
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue..."
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Button>
      </form>

      <BottomNav />
    </div>
  );
};

export default AddIssue;

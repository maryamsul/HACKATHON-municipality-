import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useIssues } from "@/context/IssuesContext";
import BottomNav from "@/components/BottomNav";
import SuccessAnimation from "@/components/SuccessAnimation";

const categories = [
  "Pothole",
  "Garbage",
  "Water Leak",
  "Lighting",
  "Traffic",
  "Other"
];

const AddIssue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addIssue } = useIssues();
  
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !location || !description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    addIssue({
      category,
      location,
      description,
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
      coordinates: { lat: 40.7128, lng: -74.006 }
    });

    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    navigate("/issues");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SuccessAnimation 
        show={showSuccess} 
        message="Issue Reported!" 
        onComplete={handleSuccessComplete} 
      />

      {/* Header */}
      <motion.header 
        className="bg-primary text-primary-foreground p-4"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex items-center gap-3">
          <motion.button 
            onClick={() => navigate(-1)} 
            className="p-1"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <h1 className="text-xl font-semibold">Report New Issue</h1>
        </div>
      </motion.header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Photo Upload */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-sm font-medium text-foreground">Photo</label>
          <motion.div 
            className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-2 bg-muted/30 cursor-pointer"
            whileHover={{ 
              scale: 1.02, 
              borderColor: "hsl(var(--primary))",
              backgroundColor: "hsl(var(--primary) / 0.05)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Camera className="w-10 h-10 text-muted-foreground" />
            </motion.div>
            <p className="text-sm text-muted-foreground">Tap to add photo</p>
          </motion.div>
        </motion.div>

        {/* Category */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-sm font-medium text-foreground">Category *</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200">
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
        </motion.div>

        {/* Location */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="text-sm font-medium text-foreground">Location *</label>
          <div className="relative group">
            <motion.div
              className="absolute left-3 top-1/2 -translate-y-1/2"
              animate={{ 
                y: [0, -2, 0],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <MapPin className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </motion.div>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location or use GPS"
              className="pl-10 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
            />
          </div>
        </motion.div>

        {/* Description */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="text-sm font-medium text-foreground">Description *</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            className="focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          >
            <Button 
              type="submit" 
              className="w-full relative overflow-hidden" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <motion.div className="flex items-center gap-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Submitting...
                </motion.div>
              ) : (
                <>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut"
                    }}
                  />
                  Submit Report
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </form>

      <BottomNav />
    </div>
  );
};

export default AddIssue;

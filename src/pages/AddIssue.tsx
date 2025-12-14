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

const API_URL = "https://ypgoodjdxcnjysrsortp.supabase.co/functions/v1/super-task";
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
    coordinates: { lat: number; lng: number };
    thumbnail: string;
  }) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
        coordinates,
        thumbnail: thumbnail || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
      });

      addIssue({
        category,
        location,
        description,
        thumbnail: thumbnail || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=

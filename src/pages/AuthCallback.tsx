import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          navigate("/auth?error=verification_failed");
          return;
        }

        // Successfully verified - redirect to home
        navigate("/");
      } catch (err) {
        console.error("Auth callback exception:", err);
        navigate("/auth?error=verification_failed");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying your email...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

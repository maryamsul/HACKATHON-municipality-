import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";

const AuthCallback = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check URL hash for recovery token BEFORE any auth operations
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const type = hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log("Auth callback - type:", type, "hasAccessToken:", !!accessToken);
        
        // If this is a password recovery flow
        if (type === 'recovery' && accessToken) {
          console.log("Password recovery flow detected");
          
          // Set the session from the URL tokens so we can update the password
          // But we will NOT redirect - we'll show the password reset form
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (sessionError) {
            console.error("Session error:", sessionError);
            toast({
              title: t('common.error'),
              description: t('auth.somethingWentWrong'),
              variant: "destructive"
            });
            navigate("/auth");
            return;
          }
          
          // Show password reset form - do NOT redirect
          setIsPasswordReset(true);
          setIsLoading(false);
          return;
        }

        // For non-recovery flows (email verification, etc.)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          navigate("/auth?error=verification_failed");
          return;
        }

        // Check if this was a recovery that already processed
        // (user refreshed the page after recovery link)
        if (data.session) {
          // Successfully verified - redirect to home
          navigate("/");
        } else {
          navigate("/auth");
        }
      } catch (err) {
        console.error("Auth callback exception:", err);
        navigate("/auth?error=verification_failed");
      }
    };

    handleAuthCallback();
  }, [navigate, toast, t]);

  const validatePasswords = (): boolean => {
    setError("");
    
    if (!newPassword || !confirmPassword) {
      setError(t('auth.bothFieldsRequired'));
      return false;
    }
    
    if (newPassword.length < 6) {
      setError(t('auth.passwordMinLength'));
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return false;
    }
    
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Update the password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        setError(updateError.message);
        toast({
          title: t('common.error'),
          description: updateError.message,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Password updated successfully - sign out to force re-login with new password
      await supabase.auth.signOut();
      
      setShowSuccess(true);
      toast({
        title: t('common.success'),
        description: t('auth.passwordUpdatedSuccess')
      });
      
      // Clear the URL hash to prevent re-processing
      window.history.replaceState(null, '', window.location.pathname);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
      
    } catch (err) {
      console.error("Password reset error:", err);
      setError(t('auth.somethingWentWrong'));
      toast({
        title: t('common.error'),
        description: t('auth.somethingWentWrong'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success screen
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {t('auth.passwordUpdated')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('auth.passwordUpdatedDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('auth.redirectingToLogin')}
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              {t('auth.goToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show password reset form
  if (isPasswordReset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {t('auth.setNewPassword')}
            </CardTitle>
            <CardDescription>
              {t('auth.enterNewPassword')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder={t('auth.enterNewPassword')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t('auth.confirmNewPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.updating')}
                  </>
                ) : (
                  t('auth.updatePassword')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">{t('auth.verifyingEmail')}</p>
      </div>
    </div>
  );
};

export default AuthCallback;

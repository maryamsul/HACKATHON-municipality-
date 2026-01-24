import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, UserRole } from "@/context/AuthContext";
import { usePhoneAuth } from "@/context/PhoneAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Users, CheckCircle, ArrowLeft, KeyRound, Phone, Smartphone } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthMethod = "email" | "phone";

const Auth = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [isSignUp, setIsSignUp] = useState(true);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  
  const { signUp, signIn, isAuthenticated } = useAuth();
  const { sendOtp, verifyOtp, isPhoneAuthenticated } = usePhoneAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated || isPhoneAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isPhoneAuthenticated, navigate]);

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('961')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.length <= 10) {
        cleaned = '+961' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    return cleaned;
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      toast({ title: t('common.error'), description: t('auth.pleaseEnterPhone'), variant: "destructive" });
      return;
    }

    if (isSignUp && !fullName) {
      toast({ title: t('common.error'), description: t('auth.pleaseEnterName'), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await sendOtp(phoneNumber, isSignUp ? fullName : undefined, isSignUp ? role : undefined);

      if (error) {
        toast({ title: t('common.error'), description: error, variant: "destructive" });
      } else {
        setShowOtpInput(true);
        toast({ 
          title: t('messages.otpSent'), 
          description: t('auth.otpSentMessage')
        });
      }
    } catch (error) {
      toast({ title: t('common.error'), description: t('auth.failedToSendOtp'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: t('common.error'), description: t('auth.pleaseEnterOtp'), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error, user } = await verifyOtp(
        phoneNumber, 
        otp, 
        isSignUp ? fullName : undefined, 
        isSignUp ? role : undefined
      );

      if (error) {
        toast({ title: t('common.error'), description: error, variant: "destructive" });
      } else if (user) {
        toast({ title: t('common.success'), description: t('auth.signedInSuccess') });
        navigate("/");
      }
    } catch (error) {
      toast({ title: t('common.error'), description: t('auth.failedToVerifyOtp'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!fullName || !email || !password) {
          toast({ title: t('common.error'), description: t('auth.pleaseFillFields'), variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(fullName, email, password, role);
        if (error) {
          if (error.toLowerCase().includes("already registered") || error.toLowerCase().includes("already exists")) {
            toast({ title: t('auth.emailAlreadyRegistered'), description: t('auth.emailAlreadyInUse'), variant: "destructive" });
            setIsSignUp(false);
          } else {
            toast({ title: t('common.error'), description: error, variant: "destructive" });
          }
        } else {
          setRegisteredEmail(email);
          setShowEmailConfirmation(true);
        }
      } else {
        if (!email || !password) {
          toast({ title: t('common.error'), description: t('auth.pleaseFillFields'), variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: t('common.error'), description: error, variant: "destructive" });
        } else {
          toast({ title: t('common.success'), description: t('auth.signedInSuccess') });
          navigate("/");
        }
      }
    } catch (error) {
      toast({ title: t('common.error'), description: t('auth.somethingWentWrong'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: t('common.error'), description: t('auth.pleaseEnterEmail'), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({ title: t('common.error'), description: error.message, variant: "destructive" });
      } else {
        setShowResetConfirmation(true);
      }
    } catch (error) {
      toast({ title: t('common.error'), description: t('auth.somethingWentWrong'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPhoneAuth = () => {
    setShowOtpInput(false);
    setOtp("");
    setPhoneNumber("");
  };

  // Show password reset confirmation screen
  if (showResetConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {t('auth.checkEmail')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('auth.resetEmailSent')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium text-foreground">{resetEmail}</p>
            <p className="text-sm text-muted-foreground">
              {t('auth.resetEmailNote')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('auth.resetExpiry')}
            </p>
            <Button 
              onClick={() => {
                setShowResetConfirmation(false);
                setShowForgotPassword(false);
                setResetEmail("");
                setIsSignUp(false);
              }} 
              className="w-full"
            >
              {t('auth.backToSignIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show forgot password form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {t('auth.resetPassword')}
            </CardTitle>
            <CardDescription>
              {t('auth.resetPasswordDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder={t('auth.enterEmail')}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                }}
                className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.backToSignIn')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show email confirmation screen after successful signup
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {t('auth.checkEmail')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('auth.emailSent')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium text-foreground">{registeredEmail}</p>
            <p className="text-sm text-muted-foreground">
              {t('auth.accountCreated')}
            </p>
            <Button 
              onClick={() => {
                setShowEmailConfirmation(false);
                setIsSignUp(false);
                setPassword("");
              }} 
              className="w-full"
            >
              {t('auth.continueToSignIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show OTP verification screen
  if (showOtpInput) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {t('auth.verifyPhone')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('auth.enterOtp')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="font-medium text-foreground">{formatPhoneNumber(phoneNumber)}</p>
            
            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('auth.otpExpiry')}
            </p>

            <div className="space-y-3">
              <Button 
                onClick={handleVerifyOtp} 
                className="w-full" 
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? t('auth.verifying') : t('auth.verifyCode')}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleSendOtp} 
                className="w-full" 
                disabled={isLoading}
              >
                {t('auth.resendCode')}
              </Button>
            </div>

            <button
              type="button"
              onClick={resetPhoneAuth}
              className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.changePhone')}
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
          </CardTitle>
          <CardDescription>
            {isSignUp ? t('auth.signUpSubtitle') : t('auth.signInSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auth Method Selector */}
          <div className="space-y-2">
            <Label>{isSignUp ? t('auth.signUpWith') : t('auth.signInWith')}</Label>
            <RadioGroup 
              value={authMethod} 
              onValueChange={(value) => setAuthMethod(value as AuthMethod)} 
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="auth-email" />
                <Label htmlFor="auth-email" className="flex items-center gap-1.5 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  {t('auth.email')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="auth-phone" />
                <Label htmlFor="auth-phone" className="flex items-center gap-1.5 cursor-pointer">
                  <Phone className="h-4 w-4" />
                  {t('auth.phone')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {authMethod === "email" ? (
            /* Email Authentication Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                  <div className="relative">
                    <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={t('auth.enterFullName')}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={isRTL ? 'pr-10' : 'pl-10'}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.enterEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth.enterPassword')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label>{t('auth.role')}</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="citizen" id="citizen" />
                      <Label htmlFor="citizen" className="flex items-center gap-1 cursor-pointer">
                        <Users className="h-4 w-4" />
                        {t('auth.citizen')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="employee" id="employee" />
                      <Label htmlFor="employee" className="flex items-center gap-1 cursor-pointer">
                        <User className="h-4 w-4" />
                        {t('auth.employee')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('common.loading') : isSignUp ? t('auth.signUp') : t('common.signIn')}
              </Button>
            </form>
          ) : (
            /* Phone Authentication Form */
            <div className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="phoneFullName">{t('auth.fullName')}</Label>
                  <div className="relative">
                    <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                      id="phoneFullName"
                      type="text"
                      placeholder={t('auth.enterFullName')}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={isRTL ? 'pr-10' : 'pl-10'}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <div className="relative">
                  <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+961 XX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('auth.enterPhone')}
                </p>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label>{t('auth.role')}</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="citizen" id="phone-citizen" />
                      <Label htmlFor="phone-citizen" className="flex items-center gap-1 cursor-pointer">
                        <Users className="h-4 w-4" />
                        {t('auth.citizen')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="employee" id="phone-employee" />
                      <Label htmlFor="phone-employee" className="flex items-center gap-1 cursor-pointer">
                        <User className="h-4 w-4" />
                        {t('auth.employee')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <Button 
                type="button" 
                className="w-full" 
                disabled={isLoading || !phoneNumber}
                onClick={handleSendOtp}
              >
                {isLoading ? t('auth.sendingOtp') : t('auth.sendOtp')}
              </Button>
            </div>
          )}

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline block w-full"
            >
              {isSignUp ? `${t('auth.hasAccount')} ${t('common.signIn')}` : `${t('auth.noAccount')} ${t('auth.signUp')}`}
            </button>
            {!isSignUp && authMethod === "email" && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-primary hover:underline block w-full"
              >
                {t('auth.forgotPassword')}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Users, CheckCircle, ArrowLeft, KeyRound } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  
  const { signUp, signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!fullName || !email || !password) {
          toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(fullName, email, password, role);
        if (error) {
          if (error.toLowerCase().includes("already registered") || error.toLowerCase().includes("already exists")) {
            toast({ title: "Email Already Registered", description: "This email is already in use. Please sign in instead.", variant: "destructive" });
            setIsSignUp(false);
          } else {
            toast({ title: "Error", description: error, variant: "destructive" });
          }
        } else {
          setRegisteredEmail(email);
          setShowEmailConfirmation(true);
        }
      } else {
        if (!email || !password) {
          toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: "Error", description: error, variant: "destructive" });
        } else {
          toast({ title: "Success", description: "Signed in successfully!" });
          navigate("/");
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: "Error", description: "Please enter your email address", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setShowResetConfirmation(true);
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Show password reset confirmation screen
  if (showResetConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-base">
              We've sent a password reset link to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium text-foreground">{resetEmail}</p>
            <p className="text-sm text-muted-foreground">
              Don't worry! Click the link in your email to reset your password and get back to your account quickly.
            </p>
            <p className="text-xs text-muted-foreground">
              The link will expire in 1 hour for security purposes.
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
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show forgot password form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Reset Password
            </CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
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
                Back to Sign In
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-base">
              We've sent a welcome email to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium text-foreground">{registeredEmail}</p>
            <p className="text-sm text-muted-foreground">
              Your account has been created successfully. You can now sign in with your credentials.
            </p>
            <Button 
              onClick={() => {
                setShowEmailConfirmation(false);
                setIsSignUp(false);
                setPassword("");
              }} 
              className="w-full"
            >
              Continue to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Sign up to report city issues" : "Sign in to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label>Role</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="citizen" id="citizen" />
                    <Label htmlFor="citizen" className="flex items-center gap-1 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Citizen
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="employee" id="employee" />
                    <Label htmlFor="employee" className="flex items-center gap-1 cursor-pointer">
                      <User className="h-4 w-4" />
                      Employee
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline block w-full"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-primary hover:underline block w-full"
              >
                Forgotten password? Click here
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

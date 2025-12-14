import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "employee" | "citizen";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (fullName: string, email: string, password: string, role: UserRole) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Get role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      setProfile({
        id: userId,
        full_name: profileData?.full_name || "",
        email: userEmail || "",
        role: (roleData?.role as UserRole) || "citizen",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(session.user.id, session.user.email);
          }, 0);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendAuthEmail = async (email: string, type: "security_alert" | "welcome", name?: string) => {
    try {
      await supabase.functions.invoke("send-auth-email", {
        body: { email, type, name },
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  const signUp = async (fullName: string, email: string, password: string, role: UserRole): Promise<{ error: string | null }> => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Check if user already exists (Supabase returns user but with empty identities or existing created_at)
    if (data.user) {
      const identities = data.user.identities;
      // If identities is empty, email already exists
      if (!identities || identities.length === 0) {
        // Send security alert email for existing account
        sendAuthEmail(email, "security_alert");
        return { error: "This email is already registered. Please sign in instead." };
      }
      
      // Check if user was created more than 10 seconds ago (meaning it's an existing user)
      const createdAt = new Date(data.user.created_at);
      const now = new Date();
      const diffSeconds = (now.getTime() - createdAt.getTime()) / 1000;
      if (diffSeconds > 10) {
        // Send security alert email for existing account
        sendAuthEmail(email, "security_alert");
        return { error: "This email is already registered. Please sign in instead." };
      }

      // New user - insert profile and role
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
      });

      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: role,
      });

      // Send welcome email for new account
      sendAuthEmail(email, "welcome", fullName);
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated: !!user,
        isLoading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

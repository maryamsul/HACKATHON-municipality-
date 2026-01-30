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

  // Fetch profile and role from Supabase
  const fetchProfile = async (user: User) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) console.error("Error fetching profile:", profileError);

      // Fetch role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) console.error("Error fetching role:", roleError);

      // Use database role first, then metadata fallback, then default to citizen
      const role =
        roleData?.role ??
        (user.user_metadata?.role as UserRole) ??
        "citizen";

      setProfile({
        id: user.id,
        full_name: profileData?.full_name || user.user_metadata?.full_name || "",
        email: user.email || "",
        role,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => fetchProfile(session.user), 0);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up function - fixed to save role properly
  const signUp = async (
    fullName: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<{ error: string | null }> => {
    const redirectUrl = `${window.location.origin}/auth/callback`;

    // Step 1: Pass role in user metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role, // <- employee/citizen metadata for trigger
        },
      },
    });

    if (error) return { error: error.message };

    // Step 2: Upsert profile table (optional, client-side)
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
      });

      // Role insert is now optional client-side because trigger handles it
      // But you can keep upsert as backup (will not fail if trigger works)
      const { error: roleError } = await supabase.from("user_roles").upsert(
        {
          user_id: data.user.id,
          role,
        },
        { onConflict: "user_id" },
      );

      if (roleError) console.error("Error inserting role:", roleError);
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      // Use secure-login edge function for rate-limited authentication
      const { data, error: invokeError } = await supabase.functions.invoke("secure-login", {
        body: { email, password },
      });

      if (invokeError) {
        console.error("Login invoke error:", invokeError);
        return { error: "An error occurred. Please try again." };
      }

      if (!data?.success) {
        // Return generic error (rate limiting is handled silently on backend)
        return { error: data?.error || "Invalid credentials" };
      }

      // Set the session from the edge function response
      if (data.session) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (setSessionError) {
          console.error("Set session error:", setSessionError);
          return { error: "Failed to establish session" };
        }
      }

      return { error: null };
    } catch (err) {
      console.error("SignIn error:", err);
      return { error: "An error occurred. Please try again." };
    }
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
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

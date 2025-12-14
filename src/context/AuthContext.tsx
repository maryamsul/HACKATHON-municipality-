import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Define possible user roles
export type UserRole = "employee" | "citizen";

// Define the structure of the user's profile
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
}

// Define the context type
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

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch user profile
  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return; // Exit early if profile fetch fails
      }

      // Fetch role data from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) {
        console.error("Error fetching role:", roleError);
        return; // Exit early if role fetch fails
      }

      // Log the fetched data for debugging
      console.log("Fetched profile data:", profileData);
      console.log("Fetched role data:", roleData);

      // Assign role based on the fetched data
      const role = roleData?.role === "employee" ? "employee" : "citizen";

      // Set profile state
      setProfile({
        id: userId,
        full_name: profileData?.full_name || "",
        email: userEmail || "",
        role: role,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener for session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch the profile after session change
        setTimeout(() => {
          fetchProfile(session.user.id, session.user.email);
        }, 0);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    // Check for existing session when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      setIsLoading(false);
    });

    // Cleanup the subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Send a custom email via Supabase Functions (e.g., welcome, security alert)
  const sendAuthEmail = async (email: string, type: "security_alert" | "welcome", name?: string) => {
    try {
      await supabase.functions.invoke("send-auth-email", {
        body: { email, type, name },
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  // Sign up new user
  const signUp = async (
    fullName: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<{ error: string | null }> => {
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

    // Check if the user already exists
    if (data.user) {
      const identities = data.user.identities;
      if (!identities || identities.length === 0) {
        sendAuthEmail(email, "security_alert");
        return { error: "This email is already registered. Please sign in instead." };
      }

      // Check if the user was created more than 10 seconds ago
      const createdAt = new Date(data.user.created_at);
      const now = new Date();
      const diffSeconds = (now.getTime() - createdAt.getTime()) / 1000;
      if (diffSeconds > 10) {
        sendAuthEmail(email, "security_alert");
        return { error: "This email is already registered. Please sign in instead." };
      }

      // New user - insert profile and role into the database
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
      });

      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: role,
      });

      // Send welcome email to the new user
      sendAuthEmail(email, "welcome", fullName);
    }

    return { error: null };
  };

  // Sign in an existing user
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

  // Sign out the user
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

// Custom hook to access the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

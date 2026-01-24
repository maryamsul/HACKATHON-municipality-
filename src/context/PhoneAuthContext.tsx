import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "employee" | "citizen";

export interface PhoneUser {
  id: string;
  phone: string;
  full_name: string | null;
  role: UserRole;
  auth_type: "phone";
}

interface PhoneSession {
  access_token: string | null;
  expires_at: string;
}

interface PhoneAuthContextType {
  phoneUser: PhoneUser | null;
  phoneSession: PhoneSession | null;
  isPhoneAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (phone: string, fullName?: string, role?: UserRole) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, otp: string, fullName?: string, role?: UserRole) => Promise<{ error: string | null; user?: PhoneUser }>;
  signOutPhone: () => void;
}

const PhoneAuthContext = createContext<PhoneAuthContextType | undefined>(undefined);

const PHONE_USER_KEY = "phone_user";
const PHONE_SESSION_KEY = "phone_session";

export const PhoneAuthProvider = ({ children }: { children: ReactNode }) => {
  const [phoneUser, setPhoneUser] = useState<PhoneUser | null>(null);
  const [phoneSession, setPhoneSession] = useState<PhoneSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored phone session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(PHONE_USER_KEY);
    const storedSession = localStorage.getItem(PHONE_SESSION_KEY);

    if (storedUser && storedSession) {
      const user = JSON.parse(storedUser) as PhoneUser;
      const session = JSON.parse(storedSession) as PhoneSession;

      // Check if session is expired
      if (new Date(session.expires_at) > new Date()) {
        setPhoneUser(user);
        setPhoneSession(session);
      } else {
        // Clear expired session
        localStorage.removeItem(PHONE_USER_KEY);
        localStorage.removeItem(PHONE_SESSION_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  // Format phone number to international format
  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, "");
    if (!cleaned.startsWith("+")) {
      if (cleaned.startsWith("961")) {
        cleaned = "+" + cleaned;
      } else if (cleaned.length <= 10) {
        cleaned = "+961" + cleaned;
      } else {
        cleaned = "+" + cleaned;
      }
    }
    return cleaned;
  };

  // Send OTP
  const sendOtp = async (
    phone: string,
    fullName?: string,
    role?: UserRole
  ): Promise<{ error: string | null }> => {
    try {
      const formattedPhone = formatPhoneNumber(phone);

      const { data, error } = await supabase.functions.invoke("send-phone-otp", {
        body: {
          phone: formattedPhone,
          full_name: fullName,
          role: role,
        },
      });

      if (error) {
        console.error("Error sending OTP:", error);
        return { error: error.message || "Failed to send OTP" };
      }

      if (data?.error) {
        return { error: data.error };
      }

      return { error: null };
    } catch (err) {
      console.error("Exception sending OTP:", err);
      return { error: "Failed to send verification code. Please try again." };
    }
  };

  // Verify OTP
  const verifyOtp = async (
    phone: string,
    otp: string,
    fullName?: string,
    role?: UserRole
  ): Promise<{ error: string | null; user?: PhoneUser }> => {
    try {
      const formattedPhone = formatPhoneNumber(phone);

      const { data, error } = await supabase.functions.invoke("verify-phone-otp", {
        body: {
          phone: formattedPhone,
          otp: otp,
          full_name: fullName,
          role: role,
        },
      });

      if (error) {
        console.error("Error verifying OTP:", error);
        return { error: error.message || "Failed to verify OTP" };
      }

      if (data?.error) {
        return { error: data.error };
      }

      if (data?.success && data?.user) {
        const user: PhoneUser = {
          id: data.user.id,
          phone: data.user.phone,
          full_name: data.user.full_name,
          role: data.user.role as UserRole,
          auth_type: "phone",
        };

        const session: PhoneSession = {
          access_token: data.session?.access_token || null,
          expires_at: data.session?.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Store in state and localStorage
        setPhoneUser(user);
        setPhoneSession(session);
        localStorage.setItem(PHONE_USER_KEY, JSON.stringify(user));
        localStorage.setItem(PHONE_SESSION_KEY, JSON.stringify(session));

        return { error: null, user };
      }

      return { error: "Verification failed. Please try again." };
    } catch (err) {
      console.error("Exception verifying OTP:", err);
      return { error: "Failed to verify code. Please try again." };
    }
  };

  // Sign out phone user
  const signOutPhone = () => {
    setPhoneUser(null);
    setPhoneSession(null);
    localStorage.removeItem(PHONE_USER_KEY);
    localStorage.removeItem(PHONE_SESSION_KEY);
  };

  return (
    <PhoneAuthContext.Provider
      value={{
        phoneUser,
        phoneSession,
        isPhoneAuthenticated: !!phoneUser,
        isLoading,
        sendOtp,
        verifyOtp,
        signOutPhone,
      }}
    >
      {children}
    </PhoneAuthContext.Provider>
  );
};

export const usePhoneAuth = () => {
  const context = useContext(PhoneAuthContext);
  if (!context) {
    throw new Error("usePhoneAuth must be used within PhoneAuthProvider");
  }
  return context;
};

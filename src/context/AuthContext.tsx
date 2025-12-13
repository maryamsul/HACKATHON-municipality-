import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "employee" | "citizen";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signUp: (fullName: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const signUp = async (fullName: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    // Frontend-only: simulate signup
    const newUser: User = {
      id: Date.now().toString(),
      fullName,
      email,
      role,
    };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    return true;
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // Frontend-only: simulate signin
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.email === email) {
        setUser(parsedUser);
        return true;
      }
    }
    // For demo, create a basic user on signin
    const newUser: User = {
      id: Date.now().toString(),
      fullName: email.split("@")[0],
      email,
      role: "citizen",
    };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    return true;
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signUp, signIn, signOut }}>
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

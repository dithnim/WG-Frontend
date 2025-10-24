import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  username?: string;
  email?: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (requiredRole: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize user state from localStorage if available
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Effect to handle user persistence
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (userData: any): Promise<boolean> => {
    try {
      console.log("Logging in user:", userData);

      // Handle different response structures
      // API returns: { token, refreshToken, userData: { email, role } }
      const userWithRole: User = {
        username:
          userData?.username ||
          userData?.userData?.username ||
          userData?.user?.username,
        email:
          userData?.email || userData?.userData?.email || userData?.user?.email,
        role:
          userData?.role ||
          userData?.userData?.role ||
          userData?.user?.role ||
          "user",
        name:
          userData?.name || userData?.userData?.name || userData?.user?.name,
        imageUrl:
          userData?.imageUrl ||
          userData?.userData?.imageUrl ||
          userData?.user?.imageUrl ||
          "",
        ...userData?.userData, // Spread userData from API response
      };

      setUser(userWithRole);
      localStorage.setItem("user", JSON.stringify(userWithRole));
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      await fetch(`${import.meta.env.VITE_API_URL}logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear all auth data
      setUser(null);
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    }
  };

  const hasRole = (requiredRole: string): boolean => {
    if (!user) return false;
    return user.role === requiredRole;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

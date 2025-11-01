import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { registerTokenInvalidCallback } from "../services/api";

interface User {
  username?: string;
  email?: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (userData: any) => Promise<boolean>;
  logout: (reason?: string) => Promise<void>;
  hasRole: (requiredRole: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAuthenticated: boolean;
  registerNotificationCallback: (callback: (message: string) => void) => void;
  validateToken: () => Promise<boolean>;
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

  // Use ref instead of state to avoid re-renders
  const notificationCallbackRef = useRef<((message: string) => void) | null>(
    null
  );

  const logout = useCallback(async (reason: string = "USER_LOGOUT") => {
    try {
      // Notify about logout reason
      if (notificationCallbackRef.current && reason !== "USER_LOGOUT") {
        let message = "";
        switch (reason) {
          case "TOKEN_EXPIRED":
            message = "Your session has expired. Please log in again.";
            break;
          case "TOKEN_INVALID":
            message = "Your session is invalid. Please log in again.";
            break;
          case "SESSION_NOT_FOUND":
            message = "No active session found. Please log in.";
            break;
          case "TOKEN_NOT_FOUND":
            message = "Authentication token not found. Please log in.";
            break;
          default:
            message = "Session ended. Please log in again.";
        }
        notificationCallbackRef.current(message);
      }

      // Call backend logout endpoint
      try {
        await fetch(`${import.meta.env.VITE_API_URL}logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch (error) {
        console.error("Logout API error:", error);
        // Continue with local logout even if API call fails
      }
    } finally {
      // Clear all auth data
      setUser(null);
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenExpiration");
    }
  }, []);

  // Register notification callback with API service (only once)
  useEffect(() => {
    const handleTokenInvalid = (reason: string) => {
      let message = "";

      switch (reason) {
        case "TOKEN_EXPIRED":
          message = "Your session has expired. Please log in again.";
          break;
        case "TOKEN_INVALID":
          message = "Your session is invalid. Please log in again.";
          break;
        case "SESSION_NOT_FOUND":
          message = "No active session found. Please log in.";
          break;
        case "TOKEN_NOT_FOUND":
          message = "Authentication token not found. Please log in.";
          break;
        default:
          message = "Session ended. Please log in again.";
      }

      if (notificationCallbackRef.current) {
        notificationCallbackRef.current(message);
      }

      // Perform logout after notification
      logout(reason);
    };

    registerTokenInvalidCallback(handleTokenInvalid);
  }, [logout]);

  // Effect to handle user persistence and token validation
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Validate token on app initialization
    validateTokenOnInit();
  }, []);

  const validateTokenOnInit = async () => {
    const token = sessionStorage.getItem("token");
    const tokenExpiration = localStorage.getItem("tokenExpiration");

    // Check if token exists
    if (!token) {
      // No token available, clear user
      if (user) {
        await logout("TOKEN_NOT_FOUND");
      }
      return;
    }

    // Check if token is expired
    if (tokenExpiration && new Date().getTime() > parseInt(tokenExpiration)) {
      await logout("TOKEN_EXPIRED");
      return;
    }
  };

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

  const hasRole = (requiredRole: string): boolean => {
    if (!user) return false;
    return user.role === requiredRole;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const registerNotificationCallback = useCallback(
    (callback: (message: string) => void) => {
      notificationCallbackRef.current = callback;
    },
    []
  );

  const validateToken = async (): Promise<boolean> => {
    const token = sessionStorage.getItem("token");
    if (!token) return false;

    const tokenExpiration = localStorage.getItem("tokenExpiration");
    if (tokenExpiration && new Date().getTime() > parseInt(tokenExpiration)) {
      return false;
    }

    return true;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user,
    registerNotificationCallback,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { registerTokenInvalidCallback } from "../services/api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loginUser,
  logoutUser,
  validateToken as validateTokenAction,
  setNotificationMessage,
  selectUser,
  selectIsAuthenticated,
  hasRole as checkHasRole,
  hasAnyRole as checkHasAnyRole,
} from "../store/authSlice";
import { LogoutReason } from "../types/auth.types";

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
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Use ref instead of state to avoid re-renders
  const notificationCallbackRef = useRef<((message: string) => void) | null>(
    null
  );

  const logout = useCallback(
    async (reason: LogoutReason = "USER_LOGOUT") => {
      try {
        // Notify about logout reason (only for manual logout or critical errors)
        if (
          notificationCallbackRef.current &&
          reason === "REFRESH_TOKEN_INVALID"
        ) {
          notificationCallbackRef.current(
            "Your session has expired. Please log in again."
          );
        }

        // Dispatch Redux logout action
        await dispatch(logoutUser(reason)).unwrap();
      } finally {
        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    },
    [dispatch]
  );

  // Register notification callback with API service (only once)
  useEffect(() => {
    const handleTokenInvalid = (reason: string) => {
      // Silently logout for most token issues
      // Only show notification for refresh token failures
      logout(reason as LogoutReason);
    };

    registerTokenInvalidCallback(handleTokenInvalid);
  }, [logout]);

  // Effect to handle token validation on app initialization
  useEffect(() => {
    const validateTokenOnInit = async () => {
      // Validate token via Redux action (it will check Redux state)
      await dispatch(validateTokenAction());
    };

    validateTokenOnInit();
  }, [dispatch]);

  const login = async (userData: any): Promise<boolean> => {
    try {
      console.log("Logging in user:", userData);

      // Dispatch Redux login action
      await dispatch(loginUser(userData)).unwrap();
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      return false;
    }
  };

  const hasRole = (requiredRole: string): boolean => {
    return checkHasRole(user, requiredRole);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return checkHasAnyRole(user, roles);
  };

  const registerNotificationCallback = useCallback(
    (callback: (message: string) => void) => {
      notificationCallbackRef.current = callback;
    },
    []
  );

  const validateToken = async (): Promise<boolean> => {
    try {
      await dispatch(validateTokenAction()).unwrap();
      return true;
    } catch (error) {
      return false;
    }
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

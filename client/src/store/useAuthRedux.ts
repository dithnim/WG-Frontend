import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loginUser,
  logoutUser,
  validateToken as validateTokenAction,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectNotificationMessage,
  hasRole as checkHasRole,
  hasAnyRole as checkHasAnyRole,
  User,
} from "../store/authSlice";
import { registerTokenInvalidCallback } from "../services/api";
import { LogoutReason } from "../types/auth.types";

/**
 * Custom hook for authentication using Redux
 * This hook provides all authentication-related functionality
 * and can be used as a direct replacement for useAuth from AuthContext
 */
export const useAuthRedux = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const notificationMessage = useAppSelector(selectNotificationMessage);

  // Use ref to store notification callback to avoid re-renders
  const notificationCallbackRef = useRef<((message: string) => void) | null>(
    null
  );

  // Login function
  const login = useCallback(
    async (userData: any): Promise<boolean> => {
      try {
        await dispatch(loginUser(userData)).unwrap();
        return true;
      } catch (error: any) {
        console.error("Login error:", error);
        return false;
      }
    },
    [dispatch]
  );

  // Logout function
  const logout = useCallback(
    async (reason: LogoutReason = "USER_LOGOUT"): Promise<void> => {
      try {
        // Notify about logout reason if callback is registered
        if (
          notificationCallbackRef.current &&
          reason === "REFRESH_TOKEN_INVALID"
        ) {
          notificationCallbackRef.current(
            "Your session has expired. Please log in again."
          );
        }

        await dispatch(logoutUser(reason)).unwrap();

        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } catch (error: any) {
        console.error("Logout error:", error);
        // Still redirect on error
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    },
    [dispatch]
  );

  // Validate token function
  const validateToken = useCallback(async (): Promise<boolean> => {
    try {
      const result = await dispatch(validateTokenAction()).unwrap();
      return result as boolean;
    } catch (error) {
      return false;
    }
  }, [dispatch]);

  // Role checking functions
  const hasRole = useCallback(
    (requiredRole: string): boolean => {
      return checkHasRole(user, requiredRole);
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return checkHasAnyRole(user, roles);
    },
    [user]
  );

  // Register notification callback
  const registerNotificationCallback = useCallback(
    (callback: (message: string) => void) => {
      notificationCallbackRef.current = callback;
    },
    []
  );

  // Register token invalid callback with API service
  useEffect(() => {
    const handleTokenInvalid = (reason: string) => {
      logout(reason as LogoutReason);
    };

    registerTokenInvalidCallback(handleTokenInvalid);
  }, [logout]);

  // Validate token on mount
  useEffect(() => {
    const validateTokenOnInit = async () => {
      // Validate token via Redux action (checks Redux state)
      await validateToken();
    };

    validateTokenOnInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated,
    loading,
    error,
    notificationMessage,
    registerNotificationCallback,
    validateToken,
  };
};

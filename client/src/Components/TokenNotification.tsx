import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toastDanger from "./toastDanger";

/**
 * TokenNotification Component
 *
 * Handles token validation and displays notifications when:
 * - Token is expired
 * - Token is invalid
 * - Session is not found
 * - User needs to be logged out due to authentication issues
 *
 * Place this component at the root level of your app (in App.tsx or main layout)
 */
export const TokenNotification: React.FC = () => {
  const { registerNotificationCallback } = useAuth();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Register the notification callback with AuthContext
    registerNotificationCallback((message: string) => {
      console.warn("Token Notification:", message);

      // Show toast notification (cast to any to satisfy ToastProps parameter)
      toastDanger(message as any);

      // Also set state to show notification
      setShowNotification(true);

      // Auto-hide after 5 seconds (toast will handle this, but keeping for safety)
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [registerNotificationCallback]);

  // This component doesn't render anything itself
  // It just handles notifications through the toast system
  return null;
};

export default TokenNotification;

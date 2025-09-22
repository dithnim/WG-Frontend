import React, { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";

interface GrantWrapperProps {
  children: ReactNode;
  allowedRoles: string[];
}

const GrantWrapper: React.FC<GrantWrapperProps> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();
  // Get user role from sessionStorage
  const userRole = user?.userData?.role;
  console.log("My Role", user);

  // Check if user has required role
  const hasAccess = allowedRoles.includes(userRole);

  return <>{hasAccess ? children : <></>}</>;
};

export default GrantWrapper;

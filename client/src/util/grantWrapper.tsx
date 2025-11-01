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
  // Get user role - the user object directly contains the role
  const userRole = user?.role;

  // Check if user has required role
  const hasAccess = userRole && allowedRoles.includes(userRole);

  return <>{hasAccess ? children : <></>}</>;
};

export default GrantWrapper;

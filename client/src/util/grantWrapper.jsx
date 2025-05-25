import React from "react";
import { useAuth } from "../contexts/AuthContext";

const GrantWrapper = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  // Get user role from sessionStorage
  const userRole = user?.userData?.role;
  console.log("My Role", user);

  // Check if user has required role
  const hasAccess = allowedRoles.includes(userRole);

  return <>{hasAccess ? children : <></>}</>;
};

export default GrantWrapper;

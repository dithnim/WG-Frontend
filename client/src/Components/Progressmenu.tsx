import React from "react";

interface ProgressMenuProps {
  children: React.ReactNode;
}

export const ProgressMenu: React.FC<ProgressMenuProps> = ({ children }) => {
  return <div className="progress-menu">{children}</div>;
};

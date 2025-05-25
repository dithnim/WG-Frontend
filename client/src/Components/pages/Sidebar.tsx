import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface MenuItem {
  path: string;
  icon: string;
  label: string;
}

const menuItems: MenuItem[] = [
  { path: "/dashboard", icon: "bx bxs-dashboard", label: "Dashboard" },
  { path: "/products", icon: "bx bxs-box", label: "Products" },
  { path: "/suppliers", icon: "bx bxs-truck", label: "Suppliers" },
  { path: "/sales", icon: "bx bxs-cart", label: "Sales" },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    logout();
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <h1>WG Shop</h1>
      </div>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? "active" : ""}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="logout">
        <button onClick={handleLogout}>
          <i className="bx bxs-log-out"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

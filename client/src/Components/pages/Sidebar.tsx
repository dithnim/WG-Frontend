import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import apiService from "../../services/api";
import GrantWrapper from "../../util/grantWrapper";
import AuthLoading from "../AuthLoading";
import "../../styles/sidebar.css";

const initialNavigation = [
  {
    name: "Dashboard",
    id: "dashboard",
    href: "/",
    current: false,
    icon: "bx bxs-dashboard me-2 text-xl",
  },
  {
    name: "Products",
    id: "products",
    href: "/products",
    current: false,
    icon: "bx bx-server me-2 text-xl",
  },
  {
    name: "Suppliers",
    id: "suppliers",
    href: "/suppliers",
    current: false,
    icon: "bx bxs-group me-2 text-xl",
  },
  {
    name: "Sales",
    id: "sales",
    href: "/sales",
    current: false,
    icon: "bx bxs-user-check me-2 text-2xl",
  },
  {
    name: "Inventory",
    id: "inventory",
    href: "/inventory",
    current: false,
    icon: "bxr bx-package me-2 text-2xl",
  },
];

const bottomNavigation = [
  {
    name: "Notifications",
    id: "notifications",
    href: "/notifications",
    current: false,
    icon: "bx bxs-bell me-2 text-xl",
  },
  {
    name: "Settings",
    id: "settings",
    href: "/settings",
    current: false,
    icon: "bx bxs-cog me-2 text-xl",
  },
  {
    name: "Logout",
    id: "logout",
    href: "#",
    current: false,
    icon: "bx bx-log-out me-2 text-xl",
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar({ onLogout, isCollapsed, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [navigation, setNavigation] = useState(initialNavigation);
  const [bottomNav, setBottomNav] = useState(bottomNavigation);
  const [menu, setMenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleMenuClick = (index, isBottom = false) => {
    const updatedNavigation = isBottom
      ? bottomNav.map((item, i) => ({ ...item, current: i === index }))
      : navigation.map((item, i) => ({ ...item, current: i === index }));

    isBottom
      ? setBottomNav(updatedNavigation)
      : setNavigation(updatedNavigation);
  };

  const handleNotificationsClick = () => {
    navigate("/notifications");
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    setIsLoggingOut(true);

    // Add a small delay to show the animation
    setTimeout(async () => {
      try {
        await apiService.post("/logout");
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        // Always call onLogout to clear the local state
        if (onLogout) {
          onLogout();
        }
        setIsLoggingOut(false);
      }
    }, 1500);
  };

  // Add ripple effect
  const createRipple = (event) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  };

  return (
    <div className="flex">
      {isLoggingOut && <AuthLoading message="Logging out..." />}
      {/* Menu Button for Small Screens */}
      <button
        onClick={() => setMenu(!menu)}
        className={`fixed top-4 left-4 z-50 text-white bg-[#262626] p-1 rounded-full md:hidden w-10 h-10 flex items-center transition-all duration-300 justify-center hover:bg-[#303030] hover:scale-110 hover:shadow-lg ${
          menu ? "translate-x-[180px] rotate-180" : "translate-x-0"
        }`}
      >
        <i
          className={`bx ${menu ? "bx-x" : "bx-menu"} text-xl transition-transform duration-300`}
        ></i>
      </button>

      {/* Overlay for Sidebar */}
      {menu && (
        <div
          onClick={() => setMenu(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform bg-[#0f0f0f] transition-all duration-500 ease-in-out z-50 border-e border-[#262626] backdrop-blur-sm ${
          menu ? "translate-x-0 shadow-2xl w-44" : "-translate-x-full w-44"
        } md:translate-x-0 md:relative ${isCollapsed ? "md:w-20" : "md:w-52 xl:w-64"}`}
        style={{
          background: "linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%)",
          boxShadow: menu ? "0 25px 50px -12px rgba(0, 0, 0, 0.8)" : "none",
        }}
      >
        {/* Desktop Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-6 top-10 z-50 text-white bg-[#262626] px-3 py-1.5 rounded-full items-center justify-center hover:bg-[#303030] hover:scale-110 transition-all duration-300 shadow-lg border border-[#404040]"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i
            className={`bx ${isCollapsed ? "bx-chevron-right" : "bx-chevron-left"} text-lg`}
          ></i>
        </button>
        <div className="flex flex-col w-full pt-5 pb-4 h-screen justify-between">
          <div>
            <div className="flex items-center justify-center mb-5">
              {isCollapsed ? (
                <div className="text-white text-xl font-bold">WG</div>
              ) : (
                <h1 className="text-white text-2xl font-bold hidden xl:flex text-center">
                  WIJESINGHE
                  <br />
                  GENUINE
                </h1>
              )}
            </div>

            <nav className="flex-1 px-3 space-y-2">
              {navigation.map((item, index) => (
                <div key={item.name} className="relative">
                  <Link
                    to={item.href}
                    id={item.id}
                    onClick={(e) => {
                      createRipple(e);
                      handleMenuClick(index);
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={classNames(
                      location.pathname === item.href
                        ? "bg-gradient-to-r from-[#262626] to-[#303030] text-white shadow-lg transform scale-105"
                        : "text-gray-300 hover:bg-gradient-to-r hover:from-[#1a1a1a] hover:to-[#262626] hover:text-white hover:transform hover:scale-105",
                      "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden cursor-pointer shadow-sm hover:shadow-lg"
                    )}
                    style={{
                      background:
                        location.pathname === item.href
                          ? "linear-gradient(135deg, #262626 0%, #303030 100%)"
                          : hoveredItem === item.id
                            ? "linear-gradient(135deg, #1a1a1a 0%, #262626 100%)"
                            : "transparent",
                    }}
                  >
                    {/* Active indicator */}
                    {location.pathname === item.href && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-lg active-indicator"></div>
                    )}

                    {/* Icon with animation */}
                    <i
                      className={`${item.icon} transition-all duration-300 ${
                        hoveredItem === item.id
                          ? "transform scale-110 rotate-6"
                          : ""
                      } ${location.pathname === item.href ? "text-blue-400" : ""} ${isCollapsed ? "mx-auto" : ""}`}
                    ></i>

                    {/* Text with slide animation */}
                    {!isCollapsed && (
                      <span
                        className={`transition-all duration-300 ${
                          hoveredItem === item.id
                            ? "transform translate-x-1"
                            : ""
                        }`}
                      >
                        {item.name}
                      </span>
                    )}

                    {/* Hover glow effect */}
                    {hoveredItem === item.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl"></div>
                    )}
                  </Link>
                </div>
              ))}
            </nav>
            <div className="flex justify-center mt-4">
              <div className="w-[85%] h-[2px] bg-[#292929] rounded-full"></div>
            </div>
          </div>
          <div className="px-3 space-y-2 pb-4 relative z-10">
            {bottomNav.map((item, index) =>
              item.id === "logout" ? (
                <button
                  key={item.name}
                  onClick={(e) => {
                    createRipple(e);
                    handleLogout(e);
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={classNames(
                    "text-gray-300 hover:bg-gradient-to-r hover:from-red-900/20 hover:to-red-800/20 hover:text-red-300 hover:transform hover:scale-105",
                    "group flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden cursor-pointer shadow-sm hover:shadow-lg"
                  )}
                  style={{
                    background:
                      hoveredItem === item.id
                        ? "linear-gradient(135deg, rgba(153, 27, 27, 0.2) 0%, rgba(127, 29, 29, 0.2) 100%)"
                        : "transparent",
                  }}
                >
                  <i
                    className={`${item.icon} transition-all duration-300 ${
                      hoveredItem === item.id
                        ? "transform scale-110 text-red-400"
                        : ""
                    } ${isCollapsed ? "mx-auto" : ""}`}
                  ></i>
                  {!isCollapsed && (
                    <span
                      className={`transition-all duration-300 ${
                        hoveredItem === item.id ? "transform translate-x-1" : ""
                      }`}
                    >
                      {item.name}
                    </span>
                  )}
                  {hoveredItem === item.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent rounded-xl"></div>
                  )}
                </button>
              ) : item.id === "notifications" ? (
                <button
                  key={item.name}
                  onClick={(e) => {
                    createRipple(e);
                    handleNotificationsClick();
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={classNames(
                    location.pathname === item.href
                      ? "bg-gradient-to-r from-[#262626] to-[#303030] text-white shadow-lg transform scale-105"
                      : "text-gray-300 hover:bg-gradient-to-r hover:from-[#1a1a1a] hover:to-[#262626] hover:text-white hover:transform hover:scale-105",
                    "group flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden cursor-pointer shadow-sm hover:shadow-lg"
                  )}
                  style={{
                    background:
                      location.pathname === item.href
                        ? "linear-gradient(135deg, #262626 0%, #303030 100%)"
                        : hoveredItem === item.id
                          ? "linear-gradient(135deg, #1a1a1a 0%, #262626 100%)"
                          : "transparent",
                  }}
                >
                  {location.pathname === item.href && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-lg active-indicator"></div>
                  )}

                  <i
                    className={`${item.icon} transition-all duration-300 ${
                      hoveredItem === item.id
                        ? "transform scale-110 rotate-6"
                        : ""
                    } ${location.pathname === item.href ? "text-blue-400" : ""} ${isCollapsed ? "mx-auto" : ""}`}
                  ></i>

                  {!isCollapsed && (
                    <span
                      className={`transition-all duration-300 ${
                        hoveredItem === item.id ? "transform translate-x-1" : ""
                      }`}
                    >
                      {item.name}
                    </span>
                  )}

                  {hoveredItem === item.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl"></div>
                  )}
                </button>
              ) : (
                <div key={item.name} className="relative">
                  <Link
                    to={item.href}
                    id={item.id}
                    onClick={(e) => {
                      createRipple(e);
                      handleMenuClick(index, true);
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={classNames(
                      location.pathname === item.href
                        ? "bg-gradient-to-r from-[#262626] to-[#303030] text-white shadow-lg transform scale-105"
                        : "text-gray-300 hover:bg-gradient-to-r hover:from-[#1a1a1a] hover:to-[#262626] hover:text-white hover:transform hover:scale-105",
                      "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden cursor-pointer shadow-sm hover:shadow-lg"
                    )}
                    style={{
                      background:
                        location.pathname === item.href
                          ? "linear-gradient(135deg, #262626 0%, #303030 100%)"
                          : hoveredItem === item.id
                            ? "linear-gradient(135deg, #1a1a1a 0%, #262626 100%)"
                            : "transparent",
                    }}
                  >
                    {location.pathname === item.href && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-lg active-indicator"></div>
                    )}

                    <i
                      className={`${item.icon} transition-all duration-300 ${
                        hoveredItem === item.id
                          ? "transform scale-110 rotate-6"
                          : ""
                      } ${location.pathname === item.href ? "text-blue-400" : ""} ${isCollapsed ? "mx-auto" : ""}`}
                    ></i>

                    {!isCollapsed && (
                      <span
                        className={`transition-all duration-300 ${
                          hoveredItem === item.id
                            ? "transform translate-x-1"
                            : ""
                        }`}
                      >
                        {item.name}
                      </span>
                    )}

                    {hoveredItem === item.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl"></div>
                    )}
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

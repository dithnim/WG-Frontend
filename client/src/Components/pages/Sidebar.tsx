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
    name: "Sales Report",
    id: "sales-report",
    href: "/sales/report",
    current: false,
    icon: "bx bxs-report me-2 text-xl",
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
        className={`fixed top-4 left-4 z-50 text-white bg-[#171717] p-1 rounded-full md:hidden w-10 h-10 flex items-center transition-all duration-300 justify-center hover:scale-110 ${
          menu ? "translate-x-[180px] rotate-180" : "translate-x-0"
        }`}
        style={{
          boxShadow:
            "0 0 15px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <i
          className={`bx ${menu ? "bx-x" : "bx-menu"} text-xl text-white transition-transform duration-300`}
          style={{
            filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))",
          }}
        ></i>
      </button>

      {/* Overlay for Sidebar */}
      {menu && (
        <div
          onClick={() => setMenu(false)}
          className="fixed inset-0 z-40 md:hidden"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          }}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform bg-[#0d0d0d] transition-all duration-500 ease-in-out z-50 backdrop-blur-sm ${
          menu ? "translate-x-0 w-44" : "-translate-x-full w-44"
        } md:translate-x-0 md:sticky md:top-0 md:h-screen md:flex-shrink-0 ${isCollapsed ? "md:w-20" : "md:w-52 xl:w-64"}`}
        style={{
          background: "linear-gradient(180deg, #0d0d0d 0%, #171717 100%)",
          boxShadow: menu
            ? "0 0 30px rgba(255, 255, 255, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.8)"
            : "0 0 20px rgba(255, 255, 255, 0.05)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Desktop Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-6 top-10 z-50 text-white bg-[#171717] px-3 py-1.5 rounded-full items-center justify-center hover:scale-110 transition-all duration-300"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            boxShadow:
              "0 0 15px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <i
            className={`bx ${isCollapsed ? "bx-chevron-right" : "bx-chevron-left"} text-lg text-white`}
          ></i>
        </button>
        <div className="flex flex-col w-full pt-5 pb-4 h-screen justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-center mb-5">
              {isCollapsed ? (
                <div
                  className="text-xl font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
                  }}
                >
                  WG
                </div>
              ) : (
                <h1
                  className="text-2xl font-bold hidden xl:flex text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
                  }}
                >
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
                        ? "text-white transform scale-105"
                        : "text-gray-300 hover:text-white hover:transform hover:scale-105",
                      "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden cursor-pointer"
                    )}
                    style={{
                      background:
                        location.pathname === item.href
                          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)"
                          : hoveredItem === item.id
                            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%)"
                            : "transparent",
                      boxShadow:
                        location.pathname === item.href
                          ? "0 0 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
                          : hoveredItem === item.id
                            ? "0 0 10px rgba(255, 255, 255, 0.05)"
                            : "none",
                      border:
                        location.pathname === item.href
                          ? "1px solid rgba(255, 255, 255, 0.2)"
                          : "1px solid transparent",
                    }}
                  >
                    {/* Active indicator */}
                    {location.pathname === item.href && (
                      <div
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full active-indicator"
                        style={{
                          background:
                            "linear-gradient(180deg, #ffffff 0%, #d1d5db 100%)",
                          boxShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
                        }}
                      ></div>
                    )}

                    {/* Icon with animation */}
                    <i
                      className={`${item.icon} transition-all duration-300 ${
                        hoveredItem === item.id
                          ? "transform scale-110 rotate-6"
                          : ""
                      } ${location.pathname === item.href ? "text-white" : ""} ${isCollapsed ? "mx-auto" : ""}`}
                      style={{
                        filter:
                          location.pathname === item.href
                            ? "drop-shadow(0 0 6px rgba(255, 255, 255, 0.5))"
                            : hoveredItem === item.id
                              ? "drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))"
                              : "none",
                      }}
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
              <div
                className="w-[85%] h-[1px] rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%)",
                  boxShadow: "0 0 8px rgba(255, 255, 255, 0.15)",
                }}
              ></div>
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
                    "text-gray-300 hover:text-red-300 hover:transform hover:scale-105",
                    "group flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden cursor-pointer"
                  )}
                  style={{
                    background:
                      hoveredItem === item.id
                        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)"
                        : "transparent",
                    boxShadow:
                      hoveredItem === item.id
                        ? "0 0 15px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)"
                        : "none",
                    border:
                      hoveredItem === item.id
                        ? "1px solid rgba(239, 68, 68, 0.3)"
                        : "1px solid transparent",
                  }}
                >
                  <i
                    className={`${item.icon} transition-all duration-300 ${
                      hoveredItem === item.id
                        ? "transform scale-110 text-red-400"
                        : ""
                    } ${isCollapsed ? "mx-auto" : ""}`}
                    style={{
                      filter:
                        hoveredItem === item.id
                          ? "drop-shadow(0 0 6px rgba(248, 113, 113, 0.6))"
                          : "none",
                    }}
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
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent rounded-xl"></div>
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
                      ? "text-white transform scale-105"
                      : "text-gray-300 hover:text-white hover:transform hover:scale-105",
                    "group flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden cursor-pointer"
                  )}
                  style={{
                    background:
                      location.pathname === item.href
                        ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)"
                        : hoveredItem === item.id
                          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%)"
                          : "transparent",
                    boxShadow:
                      location.pathname === item.href
                        ? "0 0 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
                        : hoveredItem === item.id
                          ? "0 0 10px rgba(255, 255, 255, 0.05)"
                          : "none",
                    border:
                      location.pathname === item.href
                        ? "1px solid rgba(255, 255, 255, 0.2)"
                        : "1px solid transparent",
                  }}
                >
                  {location.pathname === item.href && (
                    <div
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full active-indicator"
                      style={{
                        background:
                          "linear-gradient(180deg, #ffffff 0%, #d1d5db 100%)",
                        boxShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
                      }}
                    ></div>
                  )}

                  <i
                    className={`${item.icon} transition-all duration-300 ${
                      hoveredItem === item.id
                        ? "transform scale-110 rotate-6"
                        : ""
                    } ${location.pathname === item.href ? "text-white" : ""} ${isCollapsed ? "mx-auto" : ""}`}
                    style={{
                      filter:
                        location.pathname === item.href
                          ? "drop-shadow(0 0 6px rgba(255, 255, 255, 0.5))"
                          : hoveredItem === item.id
                            ? "drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))"
                            : "none",
                    }}
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
                        ? "text-white transform scale-105"
                        : "text-gray-300 hover:text-white hover:transform hover:scale-105",
                      "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden cursor-pointer"
                    )}
                    style={{
                      background:
                        location.pathname === item.href
                          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)"
                          : hoveredItem === item.id
                            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%)"
                            : "transparent",
                      boxShadow:
                        location.pathname === item.href
                          ? "0 0 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
                          : hoveredItem === item.id
                            ? "0 0 10px rgba(255, 255, 255, 0.05)"
                            : "none",
                      border:
                        location.pathname === item.href
                          ? "1px solid rgba(255, 255, 255, 0.2)"
                          : "1px solid transparent",
                    }}
                  >
                    {location.pathname === item.href && (
                      <div
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full active-indicator"
                        style={{
                          background:
                            "linear-gradient(180deg, #ffffff 0%, #d1d5db 100%)",
                          boxShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
                        }}
                      ></div>
                    )}

                    <i
                      className={`${item.icon} transition-all duration-300 ${
                        hoveredItem === item.id
                          ? "transform scale-110 rotate-6"
                          : ""
                      } ${location.pathname === item.href ? "text-white" : ""} ${isCollapsed ? "mx-auto" : ""}`}
                      style={{
                        filter:
                          location.pathname === item.href
                            ? "drop-shadow(0 0 6px rgba(255, 255, 255, 0.5))"
                            : hoveredItem === item.id
                              ? "drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))"
                              : "none",
                      }}
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

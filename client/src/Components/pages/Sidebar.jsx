import { useState } from "react";
import {
  BrowserRouter as Router,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import apiService from "../../services/api";
import GrantWrapper from "../../util/grantWrapper";

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
    name: "Analytics",
    id: "stats",
    href: "/stats",
    current: false,
    icon: "bx bx-stats me-2 text-2xl",
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

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [navigation, setNavigation] = useState(initialNavigation);
  const [bottomNav, setBottomNav] = useState(bottomNavigation);
  const [menu, setMenu] = useState(false);

  const handleMenuClick = (index, isBottom = false) => {
    const updatedNavigation = isBottom
      ? bottomNav.map((item, i) => ({ ...item, current: i === index }))
      : navigation.map((item, i) => ({ ...item, current: i === index }));

    isBottom
      ? setBottomNav(updatedNavigation)
      : setNavigation(updatedNavigation);
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await apiService.post("/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always call onLogout to clear the local state
      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <div className="flex">
      {/* Menu Button for Small Screens */}
      <button
        onClick={() => setMenu(!menu)}
        className={`fixed top-4 left-4 z-50 text-white bg-[#262626] p-1 rounded-full md:hidden w-10 h-10 flex items-center transition-transform duration-300 justify-center ${
          menu ? "translate-x-[180px]" : "translate-x-0"
        }`}
      >
        <i className={`bx ${menu ? "bx-x" : "bx-menu"} text-xl`}></i>
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
        className={`fixed inset-y-0 left-0 transform bg-[#0f0f0f] transition-transform duration-300 z-50 w-44 border-e border-[#262626] ${
          menu ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative md:w-52 xl:w-64`}
      >
        <div className="flex flex-col w-full pt-5 pb-4 h-screen justify-between">
          <div>
            <div className="flex items-center justify-center mb-5">
              <h1 className="text-white text-2xl font-bold hidden xl:flex text-center">
                WIJESINGHE
                <br />
                GENUINE
              </h1>
            </div>
            <nav className="flex-1 px-2 space-y-1 sidebar-icons">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  to={item.href}
                  id={item.id}
                  onClick={() => handleMenuClick(index)}
                  className={classNames(
                    location.pathname === item.href
                      ? "bg-[#262626] text-white hover:bg-[#303030] border-s-4"
                      : "text-gray-300 hover:bg-[#262626] hover:text-white",
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-e-md"
                  )}
                >
                  <i className={item.icon}></i>
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex justify-center mt-4">
              <div className="w-[85%] h-[2px] bg-[#292929] rounded-full"></div>
            </div>
          </div>
          <div className="px-2 space-y-1 pb-4">
            {bottomNav.map((item, index) =>
              item.id === "logout" ? (
                <button
                  key={item.name}
                  onClick={handleLogout}
                  className={classNames(
                    "text-gray-300 hover:bg-[#262626] hover:text-white",
                    "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md"
                  )}
                >
                  <i className={item.icon}></i>
                  {item.name}
                </button>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  id={item.id}
                  onClick={() => handleMenuClick(index, true)}
                  className={classNames(
                    location.pathname === item.href
                      ? "bg-[#262626] text-white hover:bg-[#303030]"
                      : "text-gray-300 hover:bg-[#262626] hover:text-white",
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  )}
                >
                  <i className={item.icon}></i>
                  {item.name}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

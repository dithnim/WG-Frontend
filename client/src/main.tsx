import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import apiService from "./services/api";
import Sidebar from "./Components/pages/Sidebar";
import "./index.css";
import Login from "./Components/pages/Login";
import Product from "./Components/pages/Product";
import Dashboard from "./Components/pages/Dashboard";
import Suppliers from "./Components/pages/Suppliers";
import Sales from "./Components/pages/Sales";
import Stats from "./Components/pages/Stats";
import Notifications from "./Components/pages/Notifications";
import NotFound from "./Components/pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import TokenNotification from "./Components/TokenNotification";

//Redux
import { Provider } from "react-redux";
import { store } from "./store/store";
import {
  selectIsAuthenticated,
  selectToken,
  logoutUser,
} from "./store/authSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "./store/store";
import { registerReduxStore } from "./services/api";

// Register Redux store with API service
registerReduxStore(store);

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Get authentication state from Redux using useSelector hook
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);

  // Validate token on initial load
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Function to handle logout
  const handleLogout = async () => {
    dispatch(logoutUser("USER_LOGOUT"));
  };

  // Function to toggle sidebar collapse
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <TokenNotification />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <div className="flex">
                <Sidebar
                  onLogout={handleLogout}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={handleToggleSidebar}
                />
                <div
                  className={`bg-[#0f0f0f] text-white h-auto transition-all duration-500 ${isSidebarCollapsed ? "w-[calc(100vw-4rem)]" : "w-screen"}`}
                >
                  <Dashboard />
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/products"
          element={
            isAuthenticated ? (
              <div className="flex">
                <Sidebar
                  onLogout={handleLogout}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={handleToggleSidebar}
                />
                <div
                  className={`bg-[#0f0f0f] text-white h-auto transition-all duration-500 ${isSidebarCollapsed ? "w-[calc(100vw-4rem)]" : "w-screen"}`}
                >
                  <Product />
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/suppliers"
          element={
            isAuthenticated ? (
              <div className="flex">
                <Sidebar
                  onLogout={handleLogout}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={handleToggleSidebar}
                />
                <div
                  className={`bg-[#0f0f0f] text-white h-auto transition-all duration-500 ${isSidebarCollapsed ? "w-[calc(100vw-4rem)]" : "w-screen"}`}
                >
                  <Suppliers />
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/sales"
          element={
            isAuthenticated ? (
              <div className="flex">
                <Sidebar
                  onLogout={handleLogout}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={handleToggleSidebar}
                />
                <div
                  className={`bg-[#0f0f0f] text-white h-auto transition-all duration-500 ${isSidebarCollapsed ? "w-[calc(100vw-4rem)]" : "w-screen"}`}
                >
                  <Sales />
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/stats"
          element={
            isAuthenticated ? (
              <div className="flex">
                <Sidebar
                  onLogout={handleLogout}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={handleToggleSidebar}
                />
                <div
                  className={`bg-[#0f0f0f] text-white h-auto transition-all duration-500 ${isSidebarCollapsed ? "w-[calc(100vw-4rem)]" : "w-screen"}`}
                >
                  <Stats />
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/notifications"
          element={
            isAuthenticated ? (
              <div className="flex">
                <Sidebar
                  onLogout={handleLogout}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={handleToggleSidebar}
                />
                <div
                  className={`bg-[#0f0f0f] text-white h-auto transition-all duration-500 ${isSidebarCollapsed ? "w-[calc(100vw-4rem)]" : "w-screen"}`}
                >
                  <Notifications />
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <StrictMode>
      <Provider store={store}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Provider>
    </StrictMode>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

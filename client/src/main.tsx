import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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

// Secure token storage utility
interface SecureStorage {
  setToken: (token: string) => void;
  getToken: () => string | null;
  removeToken: () => void;
}

const secureStorage: SecureStorage = {
  setToken: (token: string) => {
    sessionStorage.setItem("token", token);
  },
  getToken: () => {
    return sessionStorage.getItem("token");
  },
  removeToken: () => {
    sessionStorage.removeItem("token");
  },
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Validate token on initial load
  useEffect(() => {
    const validateToken = async () => {
      const token = secureStorage.getToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Try to make a request to a protected endpoint
        // await apiService.get('/products');
        // If we get here, the token is valid
        setIsAuthenticated(true);
      } catch (error: any) {
        console.error("Token validation error:", error);
        // Remove token if it's an authentication error
        if (error.response?.status === 401) {
          secureStorage.removeToken();
        }
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  // Function to handle login success and store the token
  const handleLogin = (token: string) => {
    secureStorage.setToken(token);
    setIsAuthenticated(true);
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await apiService.post("/logout");
    } catch (error: any) {
      console.error("Logout error:", error);
    } finally {
      secureStorage.removeToken();
      setIsAuthenticated(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <StrictMode>
      <Provider store={store}>
        <AuthProvider>
          <TokenNotification />
          <Router>
            <Routes>
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                }
              />
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <div className="flex">
                      <Sidebar onLogout={handleLogout} />
                      <div className="bg-[#0f0f0f] text-white h-auto w-screen">
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
                      <Sidebar onLogout={handleLogout} />
                      <div className="bg-[#0f0f0f] text-white h-auto w-screen">
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
                      <Sidebar onLogout={handleLogout} />
                      <div className="bg-[#0f0f0f] text-white h-auto w-screen">
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
                      <Sidebar onLogout={handleLogout} />
                      <div className="bg-[#0f0f0f] text-white h-auto w-screen">
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
                      <Sidebar onLogout={handleLogout} />
                      <div className="bg-[#0f0f0f] text-white h-auto w-screen">
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
                      <Sidebar onLogout={handleLogout} />
                      <div className="bg-[#0f0f0f] text-white h-auto w-screen">
                        <Notifications />
                      </div>
                    </div>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route path="*" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </Provider>
    </StrictMode>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

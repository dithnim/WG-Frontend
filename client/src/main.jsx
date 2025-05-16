import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Components/pages/Sidebar.jsx";
import "./index.css";
import Login from "./Components/pages/Login.jsx";
import Product from "./Components/pages/Product.jsx";
import Dashboard from "./Components/pages/Dashboard.jsx";
import Suppliers from "./Components/pages/Suppliers.jsx";
import Sales from "./Components/pages/Sales.jsx";
import Stats from "./Components/pages/Stats.jsx";

// API base URL configuration
const API_BASE_URL = "https://jlilvd91v5.execute-api.us-east-1.amazonaws.com/prod";

// Secure token storage utility
const secureStorage = {
  setToken: (token) => {
    sessionStorage.setItem("token", token);
    // Set default authorization header for future requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  },
  getToken: () => {
    return sessionStorage.getItem("token");
  },
  removeToken: () => {
    sessionStorage.removeItem("token");
    // Remove authorization header
    delete axios.defaults.headers.common["Authorization"];
  }
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
        // Set the token in axios headers before making the request
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        // Try to make a request to a protected endpoint instead of validate-token
        const response = await axios.get(`${API_BASE_URL}/products`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // If we get here, the token is valid
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation error:', error);
        // Remove token if it's an authentication error or if the endpoint is not found
        if (error.response?.status === 401 || error.response?.status === 404) {
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
  const handleLogin = (token) => {
    secureStorage.setToken(token);
    setIsAuthenticated(true);
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`);
    } catch (error) {
      console.error('Logout error:', error);
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
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <Login onLogin={handleLogin} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<App />);

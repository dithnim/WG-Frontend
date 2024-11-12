import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Sidebar from "./Components/pages/Sidebar.jsx";
import "./index.css";
import Router from "./Components/Router.jsx";
import Login from "./Components/pages/Login.jsx";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if token is present in localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
  }, []);

  // Function to handle login success and store the token
  const handleLogin = (token) => {
    localStorage.setItem("token", token); // Store token in localStorage
    setIsAuthenticated(true); // Update authentication state
  };

  return (
    <StrictMode>
      <div className="flex">
        {isAuthenticated ? (
          <>
            <Sidebar />
            <div className="bg-[#0f0f0f] text-white h-auto w-screen">
              <Router />
            </div>
          </>
        ) : (
          <Login onLogin={handleLogin} /> // Render login page if not authenticated
        )}
      </div>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<App />);

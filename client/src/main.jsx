import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Sidebar from "./Components/pages/Sidebar.jsx";
import "./index.css";
import Login from "./Components/pages/Login.jsx";
import Product from "./Components/pages/Product.jsx";
import Dashboard from "./Components/pages/Dashboard.jsx";
import Suppliers from "./Components/pages/Suppliers.jsx";
import Sales from "./Components/pages/Sales.jsx";

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
            <Router>
              <Sidebar />
              <div className="bg-[#0f0f0f] text-white h-auto w-screen">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<Product />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/sales" element={<Sales />} />
                </Routes>
              </div>
            </Router>
          </>
        ) : (
          <Login onLogin={handleLogin} /> // Render login page if not authenticated
        )}
      </div>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<App />);

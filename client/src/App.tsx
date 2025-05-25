import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/pages/Login";
import Dashboard from "./Components/pages/Dashboard";
import Suppliers from "./Components/pages/Suppliers";
import Product from "./Components/pages/Product";
import Sales from "./Components/pages/Sales";
import Stats from "./Components/pages/Stats";
import { useAuth } from "./contexts/AuthContext";

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/suppliers"
        element={isAuthenticated ? <Suppliers /> : <Navigate to="/login" />}
      />
      <Route
        path="/products"
        element={isAuthenticated ? <Product /> : <Navigate to="/login" />}
      />
      <Route
        path="/sales"
        element={isAuthenticated ? <Sales /> : <Navigate to="/login" />}
      />
      <Route
        path="/stats"
        element={isAuthenticated ? <Stats /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

export default App;

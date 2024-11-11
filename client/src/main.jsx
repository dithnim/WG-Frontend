import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Sidebar from "./Components/pages/Sidebar.jsx";
import "./index.css";

import Router from "./Components/Router.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div className="flex">
      <Sidebar />
      <div className="bg-[#0f0f0f] text-white h-auto w-screen">
        <Router />
      </div>
    </div>
  </StrictMode>
);

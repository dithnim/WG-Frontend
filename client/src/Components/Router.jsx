import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Product from "./pages/Product.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Sales from "./pages/Sales.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/products",
    element: <Product />,
  },
  {
    path: "/suppliers",
    element: <Suppliers />,
  },
  {
    path: "/sales",
    element: <Sales />,
  },
]);

const Router = (props) => {
  const currentURL = window.location.href;
  console.log(currentURL);
  //comment
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default Router;

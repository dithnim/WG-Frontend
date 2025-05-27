import React, { useEffect, useState } from "react";
import apiService from "../../services/api";
import Toast from "../toastDanger";
import GrantWrapper from "../../util/grantWrapper";
import toastSuccess from "../toastSuccess";
import ToastSuccess from "../toastSuccess";

const Product = () => {
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem("products");
    return savedProducts ? JSON.parse(savedProducts) : [];
  });
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tempProductId, setTempProductId] = useState(null);
  const [rack, setRack] = useState("");
  const [row, setRow] = useState("");
  const [column, setColumn] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);
  const [nameValidationError, setNameValidationError] = useState("");
  const [productIdValidationError, setProductIdValidationError] = useState("");
  const [costValidationError, setCostValidationError] = useState("");
  const [sellingPriceValidationError, setSellingPriceValidationError] =
    useState("");
  const [stockValidationError, setStockValidationError] = useState("");
  const [supplierValidationError, setSupplierValidationError] = useState("");
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [edittingProduct, setEdittingProduct] = useState(null);
  const [formData, setFormData] = useState({
    productName: "",
    productId: "",
    description: "",
    rackNumber: "",
    costPrice: "",
    sellingPrice: "",
    stock: "",
    category: "",
    brand: "",
    supplier: "",
  });

  // Clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Update localStorage whenever products change
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  // Fetch suppliers on mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Handle rack, row, column changes
  const handleRackChange = (event) => {
    const value = event.target.value;
    setRack(value);
    updateRackNumber(value, row, column);
  };

  const handleRowChange = (event) => {
    const value = event.target.value;
    setRow(value);
    updateRackNumber(rack, value, column);
  };

  const handleColumnChange = (event) => {
    const value = event.target.value;
    setColumn(value);
    updateRackNumber(rack, row, value);
  };

  const updateRackNumber = (newRack, newRow, newColumn) => {
    const newRackNumber =
      newRack && newRow && newColumn ? `${newRack}${newRow}${newColumn}` : "";
    setFormData({ ...formData, rackNumber: newRackNumber });
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiService.get("/products", { search: searchQuery });
      if (data && Array.isArray(data)) {
        setProducts(data);
        // Only update localStorage if the API call was successful
        localStorage.setItem("products", JSON.stringify(data));
        setError(null);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (error) {
      console.error("Error fetching products:", error);

      // Try to get cached data
      const cachedProducts = localStorage.getItem("products");
      if (cachedProducts) {
        try {
          const parsedProducts = JSON.parse(cachedProducts);
          if (Array.isArray(parsedProducts)) {
            setProducts(parsedProducts);
            setError(
              "Using cached data. Please check your internet connection."
            );
          } else {
            throw new Error("Invalid cached data format");
          }
        } catch (parseError) {
          console.error("Error parsing cached products:", parseError);
          setError("Failed to load products. Please refresh the page.");
          setProducts([]);
        }
      } else {
        setError(
          "Failed to load products. Please check your internet connection."
        );
        setProducts([]);
      }

      if (error.response?.status === 403) {
        setError("Access denied. Please check your authentication.");
      } else if (error.response?.status === 401) {
        setError("Session expired. Please log in again.");
        // Optionally redirect to login
        // window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await apiService.get("/suppliers", { search: searchQuery });
      if (data && Array.isArray(data)) {
        setSuppliers(data);
        setError(null);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError(
        "Failed to load suppliers. Please check your internet connection."
      );
      setSuppliers([]);

      if (error.response?.status === 403) {
        setError("Access denied. Please check your authentication.");
      } else if (error.response?.status === 401) {
        setError("Session expired. Please log in again.");
        // Optionally redirect to login
        // window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id) => {
    setProductIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setProductIdToDelete(null);
  };

  const confirmDeleteProduct = async () => {
    if (productIdToDelete) {
      const deletedProduct = products.find((p) => p._id === productIdToDelete);
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p._id !== productIdToDelete)
      );

      try {
        await apiService.delete(`/products?id=${productIdToDelete}`);
        closeDeleteModal();
        setError(null);
        // Show success message with product name
        const productName =
          products.find((p) => p._id === productIdToDelete)?.productName ||
          "Product";
        setSuccessMessage(`${productName} has been deleted successfully`);
      } catch (error) {
        console.error("Error deleting product:", error);
        setProducts((prevProducts) => [...prevProducts, deletedProduct]);
        if (error.response?.status === 403) {
          setError(
            "CORS error: Server rejected the delete request. Check API Gateway CORS configuration."
          );
        } else {
          setError("Failed to delete product. Please try again.");
        }
      }
    }
  };

  const handleEdit = (product) => {
    setEdittingProduct(product);
    setFormData(product);
    setRack(product.rackNumber ? product.rackNumber.slice(0, 2) : "");
    setRow(product.rackNumber ? product.rackNumber.slice(2, 3) : "");
    setColumn(product.rackNumber ? product.rackNumber.slice(3, 4) : "");
    setNameValidationError("");
    setProductIdValidationError("");
    setCostValidationError("");
    setSellingPriceValidationError("");
    setStockValidationError("");
    setSupplierValidationError("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    if (name === "productName") {
      if (value.trim() === "") {
        setNameValidationError("Product name is required");
      } else if (value.length > 100) {
        setNameValidationError("Product name cannot exceed 100 characters");
      } else {
        setNameValidationError("");
      }
    }

    if (name === "productId") {
      if (value.trim() === "") {
        setProductIdValidationError("Product ID is required");
      } else if (
        !edittingProduct &&
        products.some((p) => p.productId === value && p._id !== formData._id)
      ) {
        setProductIdValidationError("Product ID must be unique");
      } else {
        setProductIdValidationError("");
      }
    }

    if (name === "costPrice") {
      if (value === "") {
        setCostValidationError("Cost is required");
      } else if (isNaN(value) || Number(value) < 0) {
        setCostValidationError("Cost must be a non-negative number");
      } else if (
        formData.sellingPrice &&
        Number(value) > Number(formData.sellingPrice)
      ) {
        setCostValidationError("Cost cannot be greater than selling price");
      } else {
        setCostValidationError("");
      }
    }

    if (name === "sellingPrice") {
      if (value === "") {
        setSellingPriceValidationError("Selling price is required");
      } else if (isNaN(value) || Number(value) < 0) {
        setSellingPriceValidationError(
          "Selling price must be a non-negative number"
        );
      } else if (
        formData.costPrice &&
        Number(value) < Number(formData.costPrice)
      ) {
        setSellingPriceValidationError(
          "Selling price cannot be less than cost price"
        );
      } else {
        setSellingPriceValidationError("");
      }
    }

    if (name === "stock") {
      if (value === "") {
        setStockValidationError("Stock is required");
      } else if (
        isNaN(value) ||
        Number(value) < 0 ||
        !Number.isInteger(Number(value))
      ) {
        setStockValidationError("Stock must be a non-negative integer");
      } else {
        setStockValidationError("");
      }
    }

    if (name === "description" && value.length > 500) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        description: value.slice(0, 500),
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    if (name === "supplier") {
      if (value === "") {
        setSupplierValidationError("Supplier is required");
      } else if (!suppliers.some((s) => s.supplierName === value)) {
        setSupplierValidationError("Invalid supplier selected");
      } else {
        setSupplierValidationError("");
      }
    }
  };

  const handleSubmit = async () => {
    let hasErrors = false;

    if (formData.productName.trim() === "") {
      setNameValidationError("Product name is required");
      hasErrors = true;
    }
    if (formData.productId.trim() === "") {
      setProductIdValidationError("Product ID is required");
      hasErrors = true;
    } else if (
      !edittingProduct &&
      products.some(
        (p) => p.productId === formData.productId && p._id !== formData._id
      )
    ) {
      setProductIdValidationError("Product ID must be unique");
      hasErrors = true;
    }
    if (formData.costPrice === "") {
      setCostValidationError("Cost is required");
      hasErrors = true;
    } else if (isNaN(formData.costPrice) || Number(formData.costPrice) < 0) {
      setCostValidationError("Cost must be a non-negative number");
      hasErrors = true;
    }
    if (formData.sellingPrice === "") {
      setSellingPriceValidationError("Selling price is required");
      hasErrors = true;
    } else if (
      isNaN(formData.sellingPrice) ||
      Number(formData.sellingPrice) < 0
    ) {
      setSellingPriceValidationError(
        "Selling price must be a non-negative number"
      );
      hasErrors = true;
    } else if (Number(formData.sellingPrice) < Number(formData.costPrice)) {
      setSellingPriceValidationError(
        "Selling price cannot be less than cost price"
      );
      hasErrors = true;
    }
    if (formData.stock === "") {
      setStockValidationError("Stock is required");
      hasErrors = true;
    } else if (
      isNaN(formData.stock) ||
      Number(formData.stock) < 0 ||
      !Number.isInteger(Number(formData.stock))
    ) {
      setStockValidationError("Stock must be a non-negative integer");
      hasErrors = true;
    }
    if (formData.supplier === "") {
      setSupplierValidationError("Supplier is required");
      hasErrors = true;
    }

    if (hasErrors) {
      setError("Please fix all validation errors before submitting.");
      return;
    }

    try {
      console.log("Submitting product data:", formData);

      if (edittingProduct) {
        if (!edittingProduct._id) {
          throw new Error("Product ID is missing");
        }

        // Optimistic update
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p._id === edittingProduct._id
              ? { ...formData, _id: edittingProduct._id }
              : p
          )
        );

        const updateData = { ...formData };
        const response = await apiService.put(
          `/products?id=${edittingProduct._id}`,
          updateData
        );

        // Show success message with product name
        setSuccessMessage(
          `${formData.productName} has been updated successfully`
        );

        // Check if response exists and has data
        if (!response) {
          throw new Error("No response received from server");
        }

        // Update the product list with the response data if available
        if (response.data) {
          setProducts((prevProducts) =>
            prevProducts.map((p) =>
              p._id === edittingProduct._id
                ? { ...response.data, _id: edittingProduct._id }
                : p
            )
          );
        }
      } else {
        const newTempId = "temp_" + Date.now();
        setTempProductId(newTempId);

        // Optimistic update
        setProducts((prevProducts) => [
          ...prevProducts,
          { ...formData, _id: newTempId, updatedAt: new Date().toISOString() },
        ]);

        const response = await apiService.post("/products", formData);

        // Show success message with product name
        setSuccessMessage(
          `${formData.productName} has been added successfully`
        );

        // Check if response exists and has data
        if (!response) {
          throw new Error("No response received from server");
        }

        // Update the product list with the response data
        if (response.data) {
          setProducts((prevProducts) =>
            prevProducts.map((p) =>
              p._id === newTempId
                ? { ...response.data, _id: response.data._id }
                : p
            )
          );
        } else {
          // If no data in response, revert the optimistic update
          setProducts((prevProducts) =>
            prevProducts.filter((p) => p._id !== newTempId)
          );
          throw new Error("No data received from server");
        }
        setTempProductId(null);
      }

      // Reset form and states on success
      setEdittingProduct(null);
      setFormData({
        productName: "",
        productId: "",
        description: "",
        rackNumber: "",
        costPrice: "",
        sellingPrice: "",
        stock: "",
        category: "",
        brand: "",
        supplier: "",
      });
      setRack("");
      setRow("");
      setColumn("");
      setError(null);
      setNameValidationError("");
      setProductIdValidationError("");
      setCostValidationError("");
      setSellingPriceValidationError("");
      setStockValidationError("");
      setSupplierValidationError("");

      // Refresh the product list
      await fetchProducts();
    } catch (error) {
      console.error("Error updating/adding product:", error);

      // Revert optimistic updates
      if (edittingProduct) {
        await fetchProducts();
      } else {
        setProducts((prevProducts) =>
          prevProducts.filter((p) => p._id !== tempProductId)
        );
        setTempProductId(null);
      }

      if (error.response?.status === 403) {
        setError("Access denied. Please check your authentication.");
      } else if (error.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(error.message || "Failed to save product. Please try again.");
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() === "") {
        fetchProducts();
      } else {
        fetchProducts();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div className="product h-[100vh] xl:px-12 px-8 py-2">
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#171717] rounded-lg p-6 w-1/3">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete this product?</p>
            <div className="mt-6 flex justify-end">
              <button
                className="text-white px-4 py-2 rounded-lg mr-2 hover:bg-[#5f5f5f] transition-colors border border-neutral-500/50 font-semibold"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                className="bg-[#a10000] text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                onClick={confirmDeleteProduct}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <ToastSuccess
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        </div>
      )}

      {error && <Toast message={error} onClose={() => setError(null)} />}

      <div className="flex items-center justify-end md:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold hidden md:flex xl:flex">
            Products Browser{" "}
          </h1>
          <i
            className="bx bxs-fire-alt text-2xl"
            style={{ color: "#ff6300" }}
          ></i>
        </div>
        <div className="flex justify-end items-center mt-5 search">
          <input
            type="text"
            placeholder="Search products..."
            className="rounded-s-xl px-4 py-1 lg:px-6 lg:py-2 font-semibold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="hidden lg:flex items-center justify-center px-4 bg-transparent text-white rounded-e-xl py-[6px]">
            <i className="bx bx-search-alt-2 text-xl"></i>
          </button>
        </div>
      </div>

      <div className="mt-10 h-[35vh] overflow-y-auto overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="table-auto min-w-[600px] w-full">
            <thead className="sticky top-0 bg-gray-100 table-head">
              <tr>
                <th className="px-4 py-2">Product Name</th>
                <th className="px-4 py-2 hidden sm:table-cell">Product ID</th>
                <th className="px-4 py-2 hidden md:table-cell">Brand</th>
                <th className="px-4 py-2 hidden xl:table-cell">Rack Number</th>
                <th className="px-4 py-2 hidden xl:table-cell">
                  Purchased Date
                </th>
                <th className="px-4 py-2">Cost</th>
                <th className="px-4 py-2 hidden md:table-cell">
                  Selling Price
                </th>
                <th className="px-4 py-2">In Stock</th>
                <th className="px-4 py-2 hidden md:table-cell">Supplier</th>
                <GrantWrapper allowedRoles={"Admin"}>
                  <th className="px-4 py-2">Edit</th>
                </GrantWrapper>
              </tr>
            </thead>
            <tbody id="product-table-body">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-4 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No products available
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-t">
                    <td className="px-4 py-2">
                      {product.productName}
                      {product.description && (
                        <div
                          className="relative inline-block"
                          onMouseEnter={() => setHoveredProductId(product._id)}
                          onMouseLeave={() => setHoveredProductId(null)}
                        >
                          <i className="bx bx-help-circle text-xs text-gray-500 align-text-top cursor-pointer"></i>
                          <div
                            className={`absolute left-0 bg-gray-800 text-white rounded-lg p-1 text-xs mt-1 w-40 z-10 transform transition-transform duration-200 ${
                              hoveredProductId === product._id
                                ? "scale-100 opacity-100"
                                : "scale-0 opacity-0"
                            }`}
                          >
                            {product.description}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 hidden sm:table-cell">
                      {product.productId}
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      {product.brand}
                    </td>
                    <td className="px-4 py-2 hidden xl:table-cell">
                      {product.rackNumber}
                    </td>
                    <td className="px-4 py-2 hidden xl:table-cell">
                      {product.updatedAt
                        ? product.updatedAt.slice(0, 10)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2">{product.costPrice}</td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      {product.sellingPrice}
                    </td>
                    <td className="px-4 py-2">{product.stock}</td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      {product.supplier}
                    </td>
                    <GrantWrapper allowedRoles={"Admin"}>
                      <td className="px-1 py-2">
                        <i
                          className="bx bxs-pencil text-lg ms-5 edit cursor-pointer"
                          onClick={() => handleEdit(product)}
                        ></i>
                        <i
                          className="bx bxs-trash text-lg ms-1 delete cursor-pointer"
                          onClick={() => openDeleteModal(product._id)}
                        ></i>
                      </td>
                    </GrantWrapper>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-full flex justify-center items-center py-3">
        {showLoading && (
          <div role="status" className="load-animation absolute top-[40%] z-50">
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto px-2 py-2 mt-5">
        <div className="relative z-0 w-full mb-5 group">
          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="productName"
                id="floating-product-name"
                className={`block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer
                          ${nameValidationError ? "border-red-500 text-red-600 focus:border-red-600" : "border-gray-300 text-gray-900 focus:border-blue-600"}
                          dark:${nameValidationError ? "border-red-600 text-red-600 focus:border-red-500" : "border-gray-600 text-white focus:border-blue-500"}
                          `}
                placeholder=" "
                onChange={handleInputChange}
                value={formData.productName}
                required
              />
              <label
                htmlFor="floating-product-name"
                className={`absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 z-10 origin-[0]
                          ${nameValidationError ? "text-red-600 dark:text-red-500" : "text-gray-500 dark:text-gray-400"}
                          peer-focus:font-medium peer-focus:start-0 rtl:peer-focus:translate-x-1/4
                          ${nameValidationError ? "peer-focus:text-red-600 peer-focus:dark:text-red-500" : "peer-focus:text-blue-600 peer-focus:dark:text-blue-500"}
                          peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6
                        `}
              >
                Product Name*
              </label>
              {nameValidationError && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                  {nameValidationError}
                </p>
              )}
            </div>
            <div className="grid md:grid-cols-2 md:gap-4">
              <div className="relative z-0 mb-5 group">
                <input
                  type="text"
                  name="productId"
                  id="floating-product-id"
                  className={`block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer
                            ${productIdValidationError ? "border-red-500 text-red-600 focus:border-red-600" : "border-gray-300 text-gray-900 focus:border-blue-600"}
                            dark:${productIdValidationError ? "border-red-600 text-red-600 focus:border-red-500" : "border-gray-600 text-white focus:border-blue-500"}
                            `}
                  placeholder=" "
                  onChange={handleInputChange}
                  value={formData.productId}
                  required
                />
                <label
                  htmlFor="floating-product-id"
                  className={`absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0]
                            ${productIdValidationError ? "text-red-600 dark:text-red-500" : "text-gray-500 dark:text-gray-400"}
                            peer-focus:font-medium peer-focus:start-0 rtl:peer-focus:translate-x-1/4
                            ${productIdValidationError ? "peer-focus:text-red-600 peer-focus:dark:text-red-500" : "peer-focus:text-blue-600 peer-focus:dark:text-blue-500"}
                            peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6
                          `}
                >
                  Product ID*
                </label>
                {productIdValidationError && (
                  <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                    {productIdValidationError}
                  </p>
                )}
              </div>
              <div className="relative z-0 mb-5 group">
                <input
                  type="text"
                  name="brand"
                  id="floating-brand"
                  className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                  placeholder=" "
                  onChange={handleInputChange}
                  value={formData.brand}
                />
                <label
                  htmlFor="floating-brand"
                  className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Brand
                </label>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="number"
                name="costPrice"
                id="floating-cost"
                className={`block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer
                          ${costValidationError ? "border-red-500 text-red-600 focus:border-red-600" : "border-gray-300 text-gray-900 focus:border-blue-600"}
                          dark:${costValidationError ? "border-red-600 text-red-600 focus:border-red-500" : "border-gray-600 text-white focus:border-blue-500"}
                          `}
                placeholder=" "
                onChange={handleInputChange}
                value={formData.costPrice}
                required
              />
              <label
                htmlFor="floating-cost"
                className={`absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0]
                          ${costValidationError ? "text-red-600 dark:text-red-500" : "text-gray-500 dark:text-gray-400"}
                          peer-focus:font-medium peer-focus:start-0 rtl:peer-focus:translate-x-1/4
                          ${costValidationError ? "peer-focus:text-red-600 peer-focus:dark:text-red-500" : "peer-focus:text-blue-600 peer-focus:dark:text-blue-500"}
                          peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6
                        `}
              >
                Cost*
              </label>
              {costValidationError && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                  {costValidationError}
                </p>
              )}
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="number"
                name="sellingPrice"
                id="floating-selling-price"
                className={`block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer
                          ${sellingPriceValidationError ? "border-red-500 text-red-600 focus:border-red-600" : "border-gray-300 text-gray-900 focus:border-blue-600"}
                          dark:${sellingPriceValidationError ? "border-red-600 text-red-600 focus:border-red-500" : "border-gray-600 text-white focus:border-blue-500"}
                          `}
                placeholder=" "
                onChange={handleInputChange}
                value={formData.sellingPrice}
                required
              />
              <label
                htmlFor="floating-selling-price"
                className={`absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0]
                          ${sellingPriceValidationError ? "text-red-600 dark:text-red-500" : "text-gray-500 dark:text-gray-400"}
                          peer-focus:font-medium peer-focus:start-0 rtl:peer-focus:translate-x-1/4
                          ${sellingPriceValidationError ? "peer-focus:text-red-600 peer-focus:dark:text-red-500" : "peer-focus:text-blue-600 peer-focus:dark:text-blue-500"}
                          peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6
                        `}
              >
                Selling Price*
              </label>
              {sellingPriceValidationError && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                  {sellingPriceValidationError}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="number"
                name="stock"
                id="floating-stock"
                className={`block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer
                          ${stockValidationError ? "border-red-500 text-red-600 focus:border-red-600" : "border-gray-300 text-gray-900 focus:border-blue-600"}
                          dark:${stockValidationError ? "border-red-600 text-red-600 focus:border-red-500" : "border-gray-600 text-white focus:border-blue-500"}
                          `}
                placeholder=" "
                onChange={handleInputChange}
                value={formData.stock}
                required
              />
              <label
                htmlFor="floating-stock"
                className={`absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0]
                          ${stockValidationError ? "text-red-600 dark:text-red-500" : "text-gray-500 dark:text-gray-400"}
                          peer-focus:font-medium peer-focus:start-0 rtl:peer-focus:translate-x-1/4
                          ${stockValidationError ? "peer-focus:text-red-600 peer-focus:dark:text-red-500" : "peer-focus:text-blue-600 peer-focus:dark:text-blue-500"}
                          peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6
                        `}
              >
                Stock*
              </label>
              {stockValidationError && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                  {stockValidationError}
                </p>
              )}
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <div className="grid md:grid-cols-2 md:gap-2">
                <div>
                  <select
                    id="categories"
                    className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] dark:placeholder-gray-400 dark:text-white mb-2"
                    value={formData.category}
                    onChange={(e) =>
                      handleSelectChange("category", e.target.value)
                    }
                  >
                    <option value="">Select Category</option>
                    <option value="Genuine">Genuine</option>
                    <option value="Local">Local</option>
                    <option value="Helmets">Helmets</option>
                  </select>
                </div>
                <div>
                  <select
                    id="suppliers"
                    className={`text-sm rounded-lg block w-full p-2.5 bg-[#303030] dark:placeholder-gray-400 dark:text-white mb-2
                              ${supplierValidationError ? "border border-red-500" : ""}
                              `}
                    value={formData.supplier}
                    onChange={(e) =>
                      handleSelectChange("supplier", e.target.value)
                    }
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier.supplierName}>
                        {supplier.supplierName}
                      </option>
                    ))}
                  </select>
                  {supplierValidationError && (
                    <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                      {supplierValidationError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6 mb-3">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                id="floating-description"
                name="description"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.description}
              />
              <label
                htmlFor="floating-description"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Description
              </label>
            </div>
            <div className="grid md:grid-cols-3 md:gap-2 mb-5">
              <div>
                <select
                  id="rackNumbers"
                  name="rackNumber"
                  className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] dark:placeholder-gray-400 dark:text-white mb-2"
                  value={rack}
                  onChange={handleRackChange}
                >
                  <option value="">Select Rack</option>
                  <option value="R1">Rack 1</option>
                  <option value="R2">Rack 2</option>
                  <option value="R3">Rack 3</option>
                  <option value="R4">Rack 4</option>
                  <option value="R5">Rack 5</option>
                  <option value="R6">Rack 6</option>
                </select>
              </div>
              <div>
                <select
                  id="rows"
                  name="rackNumber"
                  className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] dark:placeholder-gray-400 dark:text-white mb-2"
                  value={row}
                  onChange={handleRowChange}
                >
                  <option value="">Select Bank</option>
                  <option value="A">Bank A</option>
                  <option value="B">Bank B</option>
                  <option value="C">Bank C</option>
                  <option value="D">Bank D</option>
                  <option value="E">Bank E</option>
                  <option value="F">Bank F</option>
                  <option value="G">Bank G</option>
                  <option value="H">Bank H</option>
                </select>
              </div>
              <div>
                <select
                  id="columns"
                  name="rackNumber"
                  className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] dark:placeholder-gray-400 dark:text-white mb-2"
                  value={column}
                  onChange={handleColumnChange}
                >
                  <option value="">Select Location</option>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <button
              type="button"
              className="w-full text-gray-300 bg-[#262626] focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none dark:focus:ring-blue-800"
              onClick={() => {
                setEdittingProduct(null);
                setFormData({
                  productName: "",
                  productId: "",
                  description: "",
                  rackNumber: "",
                  costPrice: "",
                  sellingPrice: "",
                  stock: "",
                  category: "",
                  brand: "",
                  supplier: "",
                });
                setRack("");
                setRow("");
                setColumn("");
                setNameValidationError("");
                setProductIdValidationError("");
                setCostValidationError("");
                setSellingPriceValidationError("");
                setStockValidationError("");
                setSupplierValidationError("");
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full text-[#303030] bg-white focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                nameValidationError ||
                productIdValidationError ||
                costValidationError ||
                sellingPriceValidationError ||
                stockValidationError ||
                supplierValidationError
              }
            >
              {edittingProduct ? "Update Product" : "Add Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;

import React from "react";
import { useEffect, useState } from "react";
import Piechart from "../Charts/Piechart";
import Linechart from "../Charts/Linechart";
import axios from "axios";

const Product = () => {
  const [products, setProducts] = useState(() => {
    // Initialize from localStorage if available
    const savedProducts = localStorage.getItem('products');
    return savedProducts ? JSON.parse(savedProducts) : [];
  });
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tempProductId, setTempProductId] = useState(null);

  // States for rack selection
  const [rack, setRack] = useState("");
  const [row, setRow] = useState("");
  const [column, setColumn] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);

  //states for validation
  const [nameValidationError, setNameValidationError] = useState("");
  const [costValidationError, setCostValidationError] = useState("");
  const [sellingPriceValidationError, setSellingPriceValidationError] =
    useState("");

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

  // Update localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

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

  const updateRackNumber = (newRack, newRow, newcolumn) => {
    setFormData({
      ...formData,
      rackNumber: `${newRack}${newRow}${newcolumn}`,
    });
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://jlilvd91v5.execute-api.us-east-1.amazonaws.com/prod/products?search=${searchQuery}`
      );
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products. Using cached data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://jlilvd91v5.execute-api.us-east-1.amazonaws.com/prod/suppliers?search=${searchQuery}`
      );
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
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
      // Optimistically remove the product from the UI
      setProducts(prevProducts => prevProducts.filter(p => p._id !== productIdToDelete));
      
      try {
        const response = await axios.delete(
          `https://jlilvd91v5.execute-api.us-east-1.amazonaws.com/prod/products/${productIdToDelete}`
        );
        if (response.status === 200) {
          closeDeleteModal();
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        // Revert the optimistic update if the server request fails
        fetchProducts();
        setError("Failed to delete product. Please try again.");
      }
    }
  };

  const handleEdit = (product) => {
    setEdittingProduct(product);
    setFormData(product);
    setRack(product.rackNumber.slice(0, 2));
    setRow(product.rackNumber.slice(2, 3));
    setColumn(product.rackNumber.slice(3, 4));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    if (name === "productName" && value.trim() === "") {
      setNameValidationError("Product name is required");
    } else {
      setNameValidationError("");
    }

    if (name === "costPrice" && value == 0) {
      setCostValidationError("Cost is required");
    } else if (name === "costPrice" && value < 0) {
      setCostValidationError("Cost cannot be negative");
    } else {
      setCostValidationError("");
    }

    if (name === "sellingPrice" && value == 0) {
      setSellingPriceValidationError("Selling price is required");
    } else if (name === "sellingPrice" && value < 0) {
      setSellingPriceValidationError("Selling price cannot be negative");
    } else {
      setSellingPriceValidationError("");
    }
  };

  const updateProductWithServerId = (tempId, serverId) => {
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p._id === tempId ? { ...p, _id: serverId } : p
      )
    );
  };

  const handleSubmit = async () => {
    try {
      const url = edittingProduct
        ? `https://jlilvd91v5.execute-api.us-east-1.amazonaws.com/prod/products/${edittingProduct._id}`
        : "https://jlilvd91v5.execute-api.us-east-1.amazonaws.com/prod/products";
      
      // Optimistically update the UI
      if (edittingProduct) {
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p._id === edittingProduct._id ? { ...formData, _id: edittingProduct._id } : p
          )
        );
      } else {
        // For new products, we'll add a temporary ID that will be replaced by the server
        const newTempId = 'temp_' + Date.now();
        setTempProductId(newTempId);
        setProducts(prevProducts => [...prevProducts, { ...formData, _id: newTempId }]);

        // Make the server request for new product
        const response = await axios.post(url, formData, {
          headers: { "Content-Type": "application/json" },
        });
        
        // Update the temporary ID with the real one from the server
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p._id === tempProductId ? { ...p, _id: response.data._id } : p
          )
        );
        setTempProductId(null);
      }

      // Handle edit case
      if (edittingProduct) {
        await axios.put(url, formData, {
          headers: { "Content-Type": "application/json" },
        });
      }
      
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
    } catch (error) {
      console.error("Error updating/adding product:", error);
      // Revert the optimistic update if the server request fails
      fetchProducts();
      setError("Failed to save product. Please try again.");
      setTempProductId(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let timer;

    if (loading) {
      timer = setTimeout(() => {
        document.getElementById("load-animation").style.display = "flex";
      }, 500);
    } else {
      document.getElementById("load-animation").style.display = "none";
    }

    return () => {
      clearTimeout(timer);
    };
  }, [loading]);

  return (
    <div className="product h-auto xl:p-12 p-8">
      {/* Delete confirmation popup */}
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

      {/* Searchbar */}
      <div className="flex items-center justify-end md:justify-between ">
        <h1 className="text-3xl font-bold hidden md:flex xl:flex">Products browser</h1>

        <div className="flex justify-end items-center mt-5 search">
          <input
            type="text"
            placeholder="Search products..."
            className="rounded-s-xl px-4 py-1 lg:px-6 lg:py-2 font-semibold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="hidden lg:flex items-center justify-center px-4  bg-transparent text-white rounded-e-xl py-[6px]">
            <i className="bx bx-search-alt-2 text-xl"></i>
          </button>
        </div>
      </div>

      <div className="mt-10 h-[40vh] overflow-y-auto overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="table-auto min-w-[600px] w-full">
            <thead className="sticky top-0 bg-gray-100 table-head">
              <tr>
                <th className="px-4 py-2">Product name</th>
                <th className="px-4 py-2 hidden sm:table-cell">Product ID</th>
                <th className="px-4 py-2 hidden md:table-cell">Brand</th>
                <th className="px-4 py-2 hidden xl:table-cell">Rack number</th>
                <th className="px-4 py-2 hidden xl:table-cell">
                  Purchased date
                </th>
                <th className="px-4 py-2">Cost</th>
                <th className="px-4 py-2 hidden md:table-cell">
                  Selling price
                </th>
                <th className="px-4 py-2">In Stock</th>
                <th className="px-4 py-2 hidden md:table-cell">Supplier</th>
                <th className="px-4 py-2">Edit</th>
              </tr>
            </thead>
            <tbody id="product-table-body">
              {products.map((product) => (
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
                    {product.updatedAt ? product.updatedAt.slice(0, 10) : 'N/A'}
                  </td>
                  <td className="px-4 py-2">
                    {product.costPrice}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell">
                    {product.sellingPrice}
                  </td>
                  <td className="px-4 py-2">{product.stock}</td>
                  <td className="px-4 py-2 hidden md:table-cell">
                    {product.supplier}
                  </td>
                  <td className="px-1 py-2">
                    <i
                      className="bx bxs-pencil text-lg ms-5 edit"
                      onClick={() => handleEdit(product)}
                    ></i>
                    <i
                      className="bx bxs-trash text-lg ms-1 delete"
                      onClick={() => openDeleteModal(product._id)}
                    ></i>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading animation */}
      <div className="w-full flex justify-center items-center py-3">
        <div
          role="status"
          id="load-animation"
          className="load-animation hidden"
        >
          <svg
            aria-hidden="true"
            className="w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-white ease-in duration-200"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>

      {/* Add/Update products*/}
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
                Product name
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
                  className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                  placeholder=" "
                  onChange={handleInputChange}
                  value={formData.productId}
                />
                <label
                  htmlFor="floating-description"
                  className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Product ID
                </label>
              </div>
              <div className="relative z-0 mb-5 group">
                <input
                  type="text"
                  name="brand"
                  className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                  placeholder=" "
                  onChange={handleInputChange}
                  value={formData.brand}
                />
                <label
                  htmlFor="floating-description"
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
                Cost
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
                Selling price
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
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.stock}
                required
              />
              <label
                htmlFor="floating-stock"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Stocks
              </label>
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <div className="grid md:grid-cols-2 md:gap-2">
                <select
                  id="categories"
                  className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] dark:placeholder-gray-400 dark:text-white mb-2"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      category: e.target.value,
                    }))
                  }
                >
                  <option value="">Select Category</option>
                  <option value="Genuine">Genuine</option>
                  <option value="Local">Local</option>
                  <option value="Helmets">Helmets</option>
                </select>

                <select
                  id="categories"
                  className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] dark:placeholder-gray-400 dark:text-white mb-2"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      supplier: e.target.value,
                    }))
                  }
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier.supplierName}>
                      {supplier.supplierName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6 mb-3">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="String"
                id="floating-description"
                name="description"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.description}
              />
              <label
                htmlFor="floating-selling-price"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Description
              </label>
            </div>
            <div className="grid md:grid-cols-3 md:gap-2 mb-5">
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

              <select
                id="categories"
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
              </select>

              <select
                id="categories"
                name="rackNumber"
                className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] dark:placeholder-gray-400 dark:text-white mb-2"
                value={column}
                onChange={handleColumnChange}
              >
                <option value="">Select Location</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <button
              type="button"
              className="w-full text-gray-300 bg-[#262626]  focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2   focus:outline-none dark:focus:ring-blue-800"
              onClick={() => {
                setEdittingProduct(null);
                setFormData({
                  productName: "",
                  productId: "",
                  rackNumber: "",
                  costPrice: "",
                  sellingPrice: "",
                  stock: "",
                  category: "",
                  supplier: "",
                });
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full text-[#303030] bg-white  focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2   focus:outline-none dark:focus:ring-blue-800"
            >
              {edittingProduct ? "Update Product" : "Add Product"}
            </button>
          </div>
        </div>
      </div>

      {/* Analytics */}
      {/* <div className="grid md:grid-cols-2 md:gap-6">
        <div className="flex items-center justify-center">
          <Piechart />
        </div>
        <div className="flex items-center justify-center">
          <Linechart />
        </div>
      </div> */}
    </div>
  );
};

export default Product;

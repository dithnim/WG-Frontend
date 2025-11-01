import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  setProducts,
  addProduct,
  updateProduct,
  removeProduct,
  replaceProductById,
  setLoading,
  setError,
  setSearchQuery,
} from "../../store/productSlice";
import type { Product } from "../../store/productSlice";
import apiService from "../../services/api";
import Toast from "../toastDanger";
import GrantWrapper from "../../util/grantWrapper";
import ToastSuccess from "../toastSuccess";

interface Supplier {
  _id: string;
  supplierName: string;
  description?: string;
  contact?: string;
  email?: string;
  createdAt?: string;
}

interface FormData {
  productName: string;
  productId: string;
  description: string;
  rackNumber: string;
  costPrice: string;
  sellingPrice: string;
  stock: string;
  category: string;
  brand: string;
  supplier: string;
}

const Product: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, error, searchQuery } = useSelector(
    (state: RootState) => state.products
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [tempProductId, setTempProductId] = useState<string | null>(null);
  const [rack, setRack] = useState<string>("");
  const [row, setRow] = useState<string>("");
  const [column, setColumn] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(
    null
  );
  const [nameValidationError, setNameValidationError] = useState<string>("");
  const [productIdValidationError, setProductIdValidationError] =
    useState<string>("");
  const [costValidationError, setCostValidationError] = useState<string>("");
  const [sellingPriceValidationError, setSellingPriceValidationError] =
    useState<string>("");
  const [stockValidationError, setStockValidationError] = useState<string>("");
  const [supplierValidationError, setSupplierValidationError] =
    useState<string>("");
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [edittingProduct, setEdittingProduct] = useState<Product | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const LIMIT = 10;
  const [formData, setFormData] = useState<FormData>({
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

  // Load cached products from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem("products");
    if (savedProducts && products.length === 0) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        if (Array.isArray(parsedProducts)) {
          dispatch(setProducts(parsedProducts));
        }
      } catch (error) {
        console.error("Error parsing cached products:", error);
      }
    }
  }, [dispatch]);

  // Clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(setError(null)), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Fetch suppliers on mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Handle rack, row, column changes
  const handleRackChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setRack(value);
    updateRackNumber(value, row, column);
  };

  const handleRowChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setRow(value);
    updateRackNumber(rack, value, column);
  };

  const handleColumnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setColumn(value);
    updateRackNumber(rack, row, value);
  };

  const updateRackNumber = (
    newRack: string,
    newRow: string,
    newColumn: string
  ) => {
    const newRackNumber =
      newRack && newRow && newColumn ? `${newRack}${newRow}${newColumn}` : "";
    setFormData({ ...formData, rackNumber: newRackNumber });
  };

  const fetchProducts = async (
    currentPage: number = 1,
    reset: boolean = false
  ) => {
    if (reset) {
      dispatch(setLoading(true));
    } else {
      setLoadingMore(true);
    }
    try {
      const params: Record<string, any> = {
        search: searchQuery,
        limit: LIMIT,
        page: currentPage,
        skip: (currentPage - 1) * LIMIT,
      };
      
      // Add supplier filter if selected
      if (selectedSupplier) {
        params.supplier = selectedSupplier;
      }
      const data = await apiService.get("/product", params);
      if (data && Array.isArray(data)) {
        // Map the nested response structure to flat Product interface
        const mappedProducts = data.map((item: any) => ({
          _id: item._id,
          productName: item.productName,
          productId: item.productId,
          description: item.description,
          rackNumber: item.rackNumber,
          costPrice: item.inventories?.[0]?.cost || 0,
          sellingPrice: item.inventories?.[0]?.sellingPrice || 0,
          stock: item.inventories?.[0]?.stock || 0,
          category: item.category,
          brand: item.brand,
          supplier: item.suppliers?.[0]?.supplierName || "",
          updatedAt: item.updatedAt,
          inventoryId: item.inventories?.[0]?._id || "",
          supplierId: item.suppliers?.[0]?._id || "",
        }));

        if (reset) {
          dispatch(setProducts(mappedProducts));
          // Only update localStorage if the API call was successful
          localStorage.setItem("products", JSON.stringify(mappedProducts));
        } else {
          // Append to existing products for lazy loading
          const currentProducts = products;
          const combinedProducts = [...currentProducts, ...mappedProducts];
          dispatch(setProducts(combinedProducts));
          localStorage.setItem("products", JSON.stringify(combinedProducts));
        }

        setHasMore(data.length === LIMIT);
        setPage(reset ? 2 : data.length > 0 ? currentPage + 1 : currentPage);
        dispatch(setError(null));
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);

      // Use error message from API service if available
      const errorMessage = error.message || "Failed to load products";

      // Try to get cached data only for network errors (not auth errors)
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        const cachedProducts = localStorage.getItem("products");
        if (cachedProducts) {
          try {
            const parsedProducts = JSON.parse(cachedProducts);
            if (Array.isArray(parsedProducts)) {
              dispatch(setProducts(parsedProducts));
              dispatch(setError("Using cached data. " + errorMessage));
              return; // Exit early since we have cached data
            }
          } catch (parseError) {
            console.error("Error parsing cached products:", parseError);
          }
        }
      }

      dispatch(setError(errorMessage));
      if (reset) {
        dispatch(setProducts([]));
      }
    } finally {
      if (reset) {
        dispatch(setLoading(false));
      } else {
        setLoadingMore(false);
      }
    }
  };

  const fetchSuppliers = async () => {
    dispatch(setLoading(true));
    try {
      const data = await apiService.get("/suppliers", { search: searchQuery });
      if (data && Array.isArray(data)) {
        setSuppliers(data);
        dispatch(setError(null));
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      const errorMessage = error.message || "Failed to load suppliers";
      dispatch(setError(errorMessage));
      setSuppliers([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const openDeleteModal = (id: string) => {
    setProductIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setProductIdToDelete(null);
  };

  const confirmDeleteProduct = async () => {
    if (productIdToDelete) {
      const deletedProduct = products.find(
        (p: Product) => p._id === productIdToDelete
      );
      dispatch(removeProduct(productIdToDelete));

      try {
        await apiService.delete(`/product/all?id=${productIdToDelete}`);
        closeDeleteModal();
        dispatch(setError(null));
        // Show success message with product name
        const productName = deletedProduct?.productName || "Product";
        setSuccessMessage(`${productName} has been deleted successfully`);
      } catch (error: any) {
        console.error("Error deleting product:", error);
        if (deletedProduct) {
          dispatch(addProduct(deletedProduct));
        }
        const errorMessage =
          error.message || "Failed to delete product. Please try again.";
        dispatch(setError(errorMessage));
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEdittingProduct(product);
    setFormData({
      productName: product.productName,
      productId: product.productId,
      description: product.description || "",
      rackNumber: product.rackNumber || "",
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      stock: product.stock.toString(),
      category: product.category || "",
      brand: product.brand || "",
      supplier: product.supplier,
    });
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

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    if (name === "description") {
      if (value.length > 500) {
        setFormData((prevFormData) => ({
          ...prevFormData,
          description: value.slice(0, 500),
        }));
      } else {
        setFormData((prevFormData) => ({
          ...prevFormData,
          description: value,
        }));
      }
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        products.some((p: Product) => p.productId === value)
      ) {
        setProductIdValidationError("Product ID must be unique");
      } else {
        setProductIdValidationError("");
      }
    }

    if (name === "costPrice") {
      // Cost is optional — validate only when provided
      if (value === "") {
        setCostValidationError("");
      } else if (isNaN(Number(value)) || Number(value) < 0) {
        setCostValidationError("Cost must be a non-negative number");
      } else if (
        formData.sellingPrice &&
        formData.sellingPrice !== "" &&
        Number(value) > Number(formData.sellingPrice)
      ) {
        setCostValidationError("Cost cannot be greater than selling price");
      } else {
        setCostValidationError("");
      }
    }

    if (name === "sellingPrice") {
      // Selling price optional — validate only when provided
      if (value === "") {
        setSellingPriceValidationError("");
      } else if (isNaN(Number(value)) || Number(value) < 0) {
        setSellingPriceValidationError(
          "Selling price must be a non-negative number"
        );
      } else if (
        formData.costPrice &&
        formData.costPrice !== "" &&
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
      // Stock is optional — validate only when provided
      if (value === "") {
        setStockValidationError("");
      } else if (
        isNaN(Number(value)) ||
        Number(value) < 0 ||
        !Number.isInteger(Number(value))
      ) {
        setStockValidationError("Stock must be a non-negative integer");
      } else {
        setStockValidationError("");
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    if (name === "supplier") {
      if (value === "") {
        setSupplierValidationError("Supplier is required");
      } else if (!suppliers.some((s: Supplier) => s.supplierName === value)) {
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
      products.some((p: Product) => p.productId === formData.productId)
    ) {
      setProductIdValidationError("Product ID must be unique");
      hasErrors = true;
    }
    // Cost, sellingPrice and stock are optional — validate only when provided
    if (formData.costPrice !== "") {
      if (isNaN(Number(formData.costPrice)) || Number(formData.costPrice) < 0) {
        setCostValidationError("Cost must be a non-negative number");
        hasErrors = true;
      }
      if (
        formData.sellingPrice !== "" &&
        Number(formData.costPrice) > Number(formData.sellingPrice)
      ) {
        setCostValidationError("Cost cannot be greater than selling price");
        hasErrors = true;
      }
    }

    if (formData.sellingPrice !== "") {
      if (
        isNaN(Number(formData.sellingPrice)) ||
        Number(formData.sellingPrice) < 0
      ) {
        setSellingPriceValidationError(
          "Selling price must be a non-negative number"
        );
        hasErrors = true;
      }
      if (
        formData.costPrice !== "" &&
        Number(formData.sellingPrice) < Number(formData.costPrice)
      ) {
        setSellingPriceValidationError(
          "Selling price cannot be less than cost price"
        );
        hasErrors = true;
      }
    }

    if (formData.stock !== "") {
      if (
        isNaN(Number(formData.stock)) ||
        Number(formData.stock) < 0 ||
        !Number.isInteger(Number(formData.stock))
      ) {
        setStockValidationError("Stock must be a non-negative integer");
        hasErrors = true;
      }
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

        // Find the supplier ID from the selected supplier name
        const selectedSupplier = suppliers.find(
          (s: Supplier) => s.supplierName === formData.supplier
        );

        if (!selectedSupplier) {
          throw new Error("Supplier not found");
        }

        // Optimistic update
        dispatch(
          updateProduct({
            ...edittingProduct,
            ...formData,
            costPrice: Number(formData.costPrice),
            sellingPrice: Number(formData.sellingPrice),
            stock: Number(formData.stock),
          })
        );

        // Restructure payload for /product/all endpoint
        const invItem: any = { _id: edittingProduct.inventoryId };
        if (formData.costPrice !== "")
          invItem.cost = Number(formData.costPrice);
        if (formData.sellingPrice !== "")
          invItem.sellingPrice = Number(formData.sellingPrice);
        if (formData.stock !== "") invItem.stock = Number(formData.stock);

        const updatePayload = {
          product: {
            productId: formData.productId,
            productName: formData.productName,
            brand: formData.brand || undefined,
            category: formData.category || undefined,
            rackNumber: formData.rackNumber || undefined,
            description: formData.description || "",
          },
          inventories: [invItem],
          supplierId: selectedSupplier._id,
        };

        const response = await apiService.put(
          `/product/all?id=${edittingProduct._id}`,
          updatePayload
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
          dispatch(
            updateProduct({ ...response.data, _id: edittingProduct._id })
          );
        }
      } else {
        const newTempId = "temp_" + Date.now();
        setTempProductId(newTempId);

        // Find the supplier ID from the selected supplier name
        const selectedSupplier = suppliers.find(
          (s: Supplier) => s.supplierName === formData.supplier
        );

        if (!selectedSupplier) {
          throw new Error("Supplier not found");
        }

        // Optimistic update
        dispatch(
          addProduct({
            ...formData,
            _id: newTempId,
            updatedAt: new Date().toISOString(),
            costPrice: Number(formData.costPrice),
            sellingPrice: Number(formData.sellingPrice),
            stock: Number(formData.stock),
          } as Product)
        );

        // Restructure payload for /products/all endpoint
        const newInvItem: any = {};
        if (formData.costPrice !== "")
          newInvItem.cost = Number(formData.costPrice);
        if (formData.sellingPrice !== "")
          newInvItem.sellingPrice = Number(formData.sellingPrice);
        if (formData.stock !== "") newInvItem.stock = Number(formData.stock);

        const productPayload = {
          product: {
            productId: formData.productId,
            productName: formData.productName,
            brand: formData.brand || undefined,
            category: formData.category || undefined,
            rackNumber: formData.rackNumber || undefined,
            description: formData.description || "",
          },
          inventories: [newInvItem],
          supplierId: selectedSupplier._id,
        };

        const response = await apiService.post("/product/all", productPayload);

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
          dispatch(
            replaceProductById({
              oldId: newTempId,
              newProduct: { ...response.data, _id: response.data._id },
            })
          );
        } else {
          // If no data in response, revert the optimistic update
          dispatch(removeProduct(newTempId));
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
      dispatch(setError(null));
      setNameValidationError("");
      setProductIdValidationError("");
      setCostValidationError("");
      setSellingPriceValidationError("");
      setStockValidationError("");
      setSupplierValidationError("");

      // Refresh the product list
      setPage(1);
      setHasMore(true);
      await fetchProducts(1, true);
    } catch (error: any) {
      console.error("Error updating/adding product:", error);

      // Revert optimistic updates
      if (edittingProduct) {
        setPage(1);
        setHasMore(true);
        await fetchProducts(1, true);
      } else {
        if (tempProductId) {
          dispatch(removeProduct(tempProductId));
        }
        setTempProductId(null);
      }

      const errorMessage =
        error.message || "Failed to save product. Please try again.";
      dispatch(setError(errorMessage));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchProducts(1, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSupplier]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>): void => {
    const target = event.currentTarget;
    const thresholdPx = 48;
    const nearBottom =
      target.scrollTop + target.clientHeight >=
      target.scrollHeight - thresholdPx;
    if (nearBottom && hasMore && !loading && !loadingMore) {
      fetchProducts(page, false);
    }
  };

  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div className="product h-auto xl:px-12 px-8 py-2 ">
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50">
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

      {error && (
        <Toast message={error} onClose={() => dispatch(setError(null))} />
      )}

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
        <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-2 mt-5">
          <select
            className="rounded-lg px-4 py-1 lg:px-4 lg:py-2 font-semibold bg-[#303030] text-white"
            value={selectedSupplier}
            onChange={(e) => {
              setSelectedSupplier(e.target.value);
              setPage(1);
              setHasMore(true);
            }}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((supplier: Supplier) => (
              <option key={supplier._id} value={supplier.supplierName}>
                {supplier.supplierName}
              </option>
            ))}
          </select>
          <div className="flex search">
            <input
              type="text"
              placeholder="Search products..."
              className="rounded-s-xl px-4 py-1 lg:px-6 lg:py-2 font-semibold"
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            />
            <button className="hidden lg:flex items-center justify-center px-4 bg-transparent text-white rounded-e-xl py-[6px]">
              <i className="bx bx-search-alt-2 text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      <div
        className="mt-10 h-[35vh] overflow-y-auto overflow-x-auto"
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="w-full">
            <table className="table-auto min-w-[600px] w-full">
              <thead className="sticky top-0 bg-transparent table-head">
                <tr>
                  <th className="px-4 py-2">Product Name</th>
                  <th className="px-4 py-2 hidden sm:table-cell">Product ID</th>
                  <th className="px-4 py-2 hidden md:table-cell">Brand</th>
                  <th className="px-4 py-2 hidden xl:table-cell">
                    Rack Number
                  </th>
                  <th className="px-4 py-2 hidden xl:table-cell">
                    Purchased Date
                  </th>
                  <th className="px-4 py-2">Cost</th>
                  <th className="px-4 py-2 hidden md:table-cell">
                    Selling Price
                  </th>
                  <th className="px-4 py-2">In Stock</th>
                  <th className="px-4 py-2 hidden md:table-cell">Supplier</th>
                  <th className="px-4 py-2">Edit</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="select-none border-t">
                    <td className="px-4 py-6">
                      <div className="h-6 bg-neutral-700 rounded animate-pulse w-3/4" />
                    </td>
                    <td className="px-4 py-6 hidden sm:table-cell">
                      <div className="h-6 bg-neutral-700 rounded animate-pulse w-2/3" />
                    </td>
                    <td className="px-4 py-6 hidden md:table-cell">
                      <div className="h-6 bg-neutral-700 rounded animate-pulse w-1/2" />
                    </td>
                    <td className="px-4 py-6 hidden xl:table-cell">
                      <div className="h-6 bg-neutral-700 rounded animate-pulse w-1/3" />
                    </td>
                    <td className="px-4 py-6 hidden xl:table-cell">
                      <div className="h-6 bg-neutral-700 rounded animate-pulse w-1/2" />
                    </td>
                    <td className="px-4 py-6">
                      <div className="h-6 bg-neutral-700 rounded animate-pulse w-16" />
                    </td>
                    <td className="px-4 py-6 hidden md:table-cell">
                      <div className="h-6 bg-neutral-700 rounded animate-pulse w-16" />
                    </td>
                    <td className="px-4 py-6">
                      <div className="h-6 bg-neutral-700 rounded animate-pulse w-12" />
                    </td>
                    <td className="px-4 py-6 hidden md:table-cell">
                      <div className="h-6 bg-neutral-700 rounded animate-pulse w-2/3" />
                    </td>
                    <td className="px-4 py-6">
                      <div className="h-6 bg-neutral-700 rounded animate-pulse w-12" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            No products available
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-auto min-w-[600px] w-full">
                <thead className="sticky top-0 bg-gray-100 table-head">
                  <tr>
                    <th className="px-4 py-2">Product Name</th>
                    <th className="px-4 py-2 hidden sm:table-cell">
                      Product ID
                    </th>
                    <th className="px-4 py-2 hidden md:table-cell">Brand</th>
                    <th className="px-4 py-2 hidden xl:table-cell">
                      Rack Number
                    </th>
                    <th className="px-4 py-2 hidden xl:table-cell">
                      Purchased Date
                    </th>
                    <th className="px-4 py-2">Cost</th>
                    <th className="px-4 py-2 hidden md:table-cell">
                      Selling Price
                    </th>
                    <th className="px-4 py-2">In Stock</th>
                    <th className="px-4 py-2 hidden md:table-cell">Supplier</th>
                    <GrantWrapper allowedRoles={["admin"]}>
                      <th className="px-4 py-2">Edit</th>
                    </GrantWrapper>
                  </tr>
                </thead>
                <tbody id="product-table-body">
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-4 text-center text-gray-400"
                      >
                        No products available
                      </td>
                    </tr>
                  ) : (
                    products.map((product: Product) => (
                      <tr key={product._id} className="border-t">
                        <td className="px-4 py-2">
                          {product.productName}
                          {product.description && (
                            <div
                              className="relative inline-block"
                              onMouseEnter={() =>
                                setHoveredProductId(product._id)
                              }
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
                        <td className="px-4 py-2">{product.costPrice || 0}</td>
                        <td className="px-4 py-2 hidden md:table-cell">
                          {product.sellingPrice || 0}
                        </td>
                        <td className="px-4 py-2">{product.stock || 0}</td>
                        <td className="px-4 py-2 hidden md:table-cell">
                          {product.supplier}
                        </td>
                        <GrantWrapper allowedRoles={["admin"]}>
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
            {loadingMore && (
              <div className="flex justify-center items-center py-4 gap-1">
                <div
                  className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            )}
          </>
        )}
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
                          ${nameValidationError ? "border-red-600 text-red-600 focus:border-red-500" : "border-gray-600 text-white focus:border-blue-500"}
                          `}
                placeholder=" "
                onChange={handleInputChange}
                value={formData.productName}
                required
              />
              <label
                htmlFor="floating-product-name"
                className={`absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 z-10 origin-[0]
                          ${nameValidationError ? "text-red-500" : "text-gray-400"}
                          peer-focus:font-medium peer-focus:start-0 rtl:peer-focus:translate-x-1/4
                          ${nameValidationError ? " peer-focus:text-red-500" : " peer-focus:text-blue-500"}
                          peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6
                        `}
              >
                Product Name*
              </label>
              {nameValidationError && (
                <p className="text-sm text-red-500 mt-1">
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
                            ${productIdValidationError ? "border-red-600 text-red-600 focus:border-red-500" : "border-gray-600 text-white focus:border-blue-500"}
                            `}
                  placeholder=" "
                  onChange={handleInputChange}
                  value={formData.productId}
                  required
                />
                <label
                  htmlFor="floating-product-id"
                  className={`absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0]
                            ${productIdValidationError ? "text-red-500" : "text-gray-400"}
                            peer-focus:font-medium peer-focus:start-0 rtl:peer-focus:translate-x-1/4
                            ${productIdValidationError ? " peer-focus:text-red-500" : "peer-focus:text-blue-500"}
                            peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6
                          `}
                >
                  Product ID*
                </label>
                {productIdValidationError && (
                  <p className="text-sm text-red-500 mt-1">
                    {productIdValidationError}
                  </p>
                )}
              </div>
              <div className="relative z-0 mb-5 group">
                <input
                  type="text"
                  name="brand"
                  id="floating-brand"
                  className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 text-white border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 peer"
                  placeholder=" "
                  onChange={handleInputChange}
                  value={formData.brand}
                />
                <label
                  htmlFor="floating-brand"
                  className="peer-focus:font-medium absolute text-sm  text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
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
                          ${costValidationError ? "border-red-600 text-red-600 focus:border-red-500" : "border-gray-600 text-white focus:border-blue-500"}
                          `}
                placeholder=" "
                onChange={handleInputChange}
                value={formData.costPrice}
              />
              <label
                htmlFor="floating-cost"
                className={`absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0]
                          ${costValidationError ? "text-red-500" : "text-gray-400"}
                          peer-focus:font-medium peer-focus:start-0 rtl:peer-focus:translate-x-1/4
                          ${costValidationError ? " peer-focus:text-red-500" : " peer-focus:text-blue-500"}
                          peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6
                        `}
              >
                Cost
              </label>
              {costValidationError && (
                <p className="text-sm text-red-500 mt-1">
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
                          ${sellingPriceValidationError ? "border-red-600 text-red-600 focus:border-red-500" : "border-gray-600 text-white focus:border-blue-500"}
                          `}
                placeholder=" "
                onChange={handleInputChange}
                value={formData.sellingPrice}
              />
              <label
                htmlFor="floating-selling-price"
                className={`absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0]
                          ${sellingPriceValidationError ? "text-red-500" : "text-gray-400"}
                          peer-focus:font-medium peer-focus:start-0 rtl:peer-focus:translate-x-1/4
                          ${sellingPriceValidationError ? " peer-focus:text-red-500" : "peer-focus:text-blue-500"}
                          peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6
                        `}
              >
                Selling Price
              </label>
              {sellingPriceValidationError && (
                <p className="text-sm text-red-500 mt-1">
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
                          ${stockValidationError ? "border-red-600 text-red-600 focus:border-red-500" : "border-gray-600 text-white focus:border-blue-500"}
                          `}
                placeholder=" "
                onChange={handleInputChange}
                value={formData.stock}
              />
              <label
                htmlFor="floating-stock"
                className={`absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0]
                          ${stockValidationError ? "text-red-500" : "text-gray-400"}
                          peer-focus:font-medium peer-focus:start-0 rtl:peer-focus:translate-x-1/4
                          ${stockValidationError ? " peer-focus:text-red-500" : " peer-focus:text-blue-500"}
                          peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6
                        `}
              >
                Stock
              </label>
              {stockValidationError && (
                <p className="text-smtext-red-500 mt-1">
                  {stockValidationError}
                </p>
              )}
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <div className="grid md:grid-cols-2 md:gap-2">
                <div>
                  <select
                    id="categories"
                    className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] placeholder-gray-400 text-white mb-2"
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
                    className={`text-sm rounded-lg block w-full p-2.5 bg-[#303030] placeholder-gray-400 text-white mb-2
                              ${supplierValidationError ? "border border-red-500" : ""}
                              `}
                    value={formData.supplier}
                    onChange={(e) =>
                      handleSelectChange("supplier", e.target.value)
                    }
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier: Supplier) => (
                      <option key={supplier._id} value={supplier.supplierName}>
                        {supplier.supplierName}
                      </option>
                    ))}
                  </select>
                  {supplierValidationError && (
                    <p className="text-sm text-red-500 mt-1">
                      {supplierValidationError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6 mb-3">
            <div className="relative z-0 w-full mb-5 group">
              <textarea
                id="floating-description"
                name="description"
                rows={3}
                className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none text-white border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 peer resize-none"
                placeholder=" "
                onChange={handleTextareaChange}
                value={formData.description}
                maxLength={500}
              />
              <label
                htmlFor="floating-description"
                className="peer-focus:font-medium absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Description ({formData.description.length}/500)
              </label>
            </div>
            <div className="grid md:grid-cols-3 md:gap-2 mb-5">
              <div>
                <select
                  id="rackNumbers"
                  name="rackNumber"
                  className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] placeholder-gray-400 text-white mb-2"
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
                  className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] placeholder-gray-400 text-white mb-2"
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
                  className="text-sm rounded-lg block w-full p-2.5 bg-[#303030] placeholder-gray-400 text-white mb-2"
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
              className="w-full text-gray-300 bg-[#262626] focus:ring-2 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none focus:ring-blue-800"
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
              className="w-full text-[#303030] bg-white focus:ring-2 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !!nameValidationError ||
                !!productIdValidationError ||
                !!costValidationError ||
                !!sellingPriceValidationError ||
                !!stockValidationError ||
                !!supplierValidationError
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

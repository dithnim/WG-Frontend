import React, { useState, useEffect } from "react";
import apiService from "../../services/api";
import Toast from "../Toast";
import { Product as ProductType, Supplier } from "../../types/api";

interface FormData {
  productName: string;
  productId: string;
  description: string;
  rackNumber: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  category: string;
  brand: string;
  supplier: string;
}

const Product: React.FC = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    productId: "",
    description: "",
    rackNumber: "",
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    category: "",
    brand: "",
    supplier: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(
    null
  );
  const [tempProductId, setTempProductId] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProducts = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.get<ProductType[]>("/products", {
        search: searchQuery,
      });
      setProducts(data);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      if (error.response?.status === 403) {
        setError(
          "CORS error: Server rejected the request. Check API Gateway CORS configuration."
        );
      } else {
        setError(error.message || "Failed to fetch products");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async (): Promise<void> => {
    try {
      const data = await apiService.get<Supplier[]>("/suppliers");
      setSuppliers(data);
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      setError(error.message || "Failed to fetch suppliers");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openDeleteModal = (id: string): void => {
    setProductIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = (): void => {
    setShowDeleteModal(false);
    setProductIdToDelete(null);
  };

  const handleSubmit = async (): Promise<void> => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    // Perform optimistic update and reset form immediately
    if (editingProduct) {
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === editingProduct._id ? { ...p, ...formData } : p
        )
      );
    } else {
      const newTempId = "temp_" + Date.now();
      setTempProductId(newTempId);
      setProducts((prevProducts) => [
        ...prevProducts,
        { ...formData, _id: newTempId, createdAt: new Date().toISOString() },
      ]);
    }

    // Reset form
    setEditingProduct(null);
    setFormData({
      productName: "",
      productId: "",
      description: "",
      rackNumber: "",
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      category: "",
      brand: "",
      supplier: "",
    });
    setTempProductId(null);

    try {
      if (editingProduct) {
        const updateData = {
          ...formData,
          _id: editingProduct._id,
        };
        await apiService.put<ProductType>(
          `/products?id=${editingProduct._id}`,
          updateData
        );
      } else {
        const data = await apiService.post<ProductType>("/products", formData);
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p._id === tempProductId
              ? {
                  ...p,
                  _id: data._id,
                }
              : p
          )
        );
      }
    } catch (error: any) {
      console.error("Error updating/adding product:", error);
      fetchProducts(); // Refetch to sync state
      if (error.response?.status === 403) {
        setError(
          "CORS error: Server rejected the request. Check API Gateway CORS configuration."
        );
      } else if (error.response?.status === 400) {
        setError(
          error.response?.data?.message ||
            "Invalid product data. Please check all fields."
        );
      } else {
        setError(error.message || "Failed to save product. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteProduct = async (): Promise<void> => {
    if (productIdToDelete) {
      const deletedProduct = products.find((p) => p._id === productIdToDelete);
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p._id !== productIdToDelete)
      );
      closeDeleteModal(); // Close modal immediately

      try {
        await apiService.delete<ProductType>(
          `/products?id=${productIdToDelete}`
        );
        setError(null);
      } catch (error: any) {
        console.error("Error deleting product:", error);
        if (deletedProduct) {
          setProducts((prevProducts) => [...prevProducts, deletedProduct]);
        }
        if (error.response?.status === 403) {
          setError(
            "CORS error: Server rejected the delete request. Check API Gateway CORS configuration."
          );
        } else {
          setError(
            error.response?.data?.message ||
              error.message ||
              "Failed to delete product"
          );
        }
      }
    }
  };

  const handleEdit = (product: ProductType): void => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName || "",
      productId: product.productId || "",
      description: product.description || "",
      rackNumber: product.rackNumber || "",
      costPrice: product.costPrice || 0,
      sellingPrice: product.sellingPrice || 0,
      stock: product.stock || 0,
      category: product.category || "",
      brand: product.brand || "",
      supplier: product.supplier || "",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]:
        name === "costPrice" || name === "sellingPrice" || name === "stock"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  return (
    <div className="product h-screen p-12">
      {error && <Toast message={error} onClose={() => setError(null)} />}

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg dark:bg-[#171717] dark:border-gray-600 dark:text-white"
        />
      </div>

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

      <div className="mt-10 h-[40vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
            No products available
          </div>
        ) : (
          <table className="table-auto w-full">
            <thead className="sticky top-0 bg-transparent table-head">
              <tr>
                <th>Product name</th>
                <th>Product ID</th>
                <th>Description</th>
                <th>Rack number</th>
                <th>Cost price</th>
                <th>Selling price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Supplier</th>
                <th>Last updated</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody id="product-table-body">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-4 py-2">{product.productName}</td>
                  <td className="px-4 py-2">{product.productId}</td>
                  <td className="px-4 py-2">{product.description}</td>
                  <td className="px-4 py-2">{product.rackNumber}</td>
                  <td className="px-4 py-2">${product.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    ${product.sellingPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-2">{product.stock}</td>
                  <td className="px-4 py-2">{product.category}</td>
                  <td className="px-4 py-2">{product.brand}</td>
                  <td className="px-4 py-2">{product.supplier}</td>
                  <td className="px-4 py-2">
                    {product.createdAt ? product.createdAt.slice(0, 10) : "N/A"}
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
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
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.productName}
                required
              />
              <label
                htmlFor="floating-product-name"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Product name
              </label>
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="productId"
                id="floating-product-id"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.productId}
                required
              />
              <label
                htmlFor="floating-product-id"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Product ID
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="description"
                id="floating-description"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.description}
                required
              />
              <label
                htmlFor="floating-description"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Description
              </label>
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="rackNumber"
                id="floating-rack-number"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.rackNumber}
                required
              />
              <label
                htmlFor="floating-rack-number"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Rack number
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="number"
                name="costPrice"
                id="floating-cost-price"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.costPrice}
                min="0"
                step="0.01"
                required
              />
              <label
                htmlFor="floating-cost-price"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Cost price
              </label>
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="number"
                name="sellingPrice"
                id="floating-selling-price"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.sellingPrice}
                min="0"
                step="0.01"
                required
              />
              <label
                htmlFor="floating-selling-price"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Selling price
              </label>
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
                min="0"
                required
              />
              <label
                htmlFor="floating-stock"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Stock
              </label>
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="category"
                id="floating-category"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.category}
                required
              />
              <label
                htmlFor="floating-category"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Category
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="brand"
                id="floating-brand"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.brand}
                required
              />
              <label
                htmlFor="floating-brand"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Brand
              </label>
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <select
                name="supplier"
                id="floating-supplier"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                onChange={handleInputChange}
                value={formData.supplier}
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.supplierName}
                  </option>
                ))}
              </select>
              <label
                htmlFor="floating-supplier"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Supplier
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <button
              type="button"
              className="w-full text-gray-300 bg-[#262626] focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none dark:focus:ring-blue-800"
              onClick={() => {
                setEditingProduct(null);
                setFormData({
                  productName: "",
                  productId: "",
                  description: "",
                  rackNumber: "",
                  costPrice: 0,
                  sellingPrice: 0,
                  stock: 0,
                  category: "",
                  brand: "",
                  supplier: "",
                });
              }}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full text-[#303030] bg-white focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none dark:focus:ring-blue-800"
              disabled={submitting}
            >
              {submitting
                ? "Processing..."
                : editingProduct
                  ? "Update product"
                  : "Add product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;

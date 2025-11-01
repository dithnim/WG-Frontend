import React, { useEffect, useState } from "react";
import apiService from "../../services/api";
import Toast from "../toastDanger";

interface Product {
  _id: string;
  productName: string;
  productId: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  category?: string;
  brand?: string;
  supplier?: string;
}

const Notifications: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState<boolean>(false);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.get("/product");
      if (Array.isArray(data)) {
        // Map and filter products with stock < 3
        const mappedProducts = data
          .map((item: any) => ({
            _id: item._id,
            productName: item.productName,
            productId: item.productId,
            stock: item.inventories?.[0]?.stock || 0,
            costPrice: item.inventories?.[0]?.cost || 0,
            sellingPrice: item.inventories?.[0]?.sellingPrice || 0,
            category: item.category,
            brand: item.brand,
            supplier: item.suppliers?.[0]?.supplierName || "",
          }))
          .filter((product: Product) => product.stock < 3);

        setLowStockProducts(mappedProducts);
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setError(error.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(lowStockProducts.map((p) => p._id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
    setSelectAll(newSelected.size === lowStockProducts.length);
  };

  return (
    <div className="notifications h-screen flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-6">
      {error && <Toast message={error} onClose={() => setError(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
            <i className="bx bxs-bell text-3xl text-yellow-500"></i>
          </div>
        </div>
        <button
          onClick={fetchLowStockProducts}
          className="flex items-center gap-2 px-4 py-2 bg-[#262626] hover:bg-[#303030] rounded-lg transition-colors"
        >
          <i className="bx bx-refresh text-xl"></i>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Notification Cards */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <i className="bx bx-check-circle text-6xl mb-4 text-green-500"></i>
            <p className="text-xl">No low stock alerts</p>
            <p className="text-sm mt-2">All products have sufficient stock</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Product Cards */}
            {lowStockProducts.map((product) => (
              <div
                key={product._id}
                className={`bg-[#1a1a1a] border rounded-lg px-4 py-4 transition-all cursor-pointer ${
                  selectedProducts.has(product._id)
                    ? "border-blue-600 bg-blue-950/20"
                    : "border-neutral-800 hover:border-neutral-700 hover:bg-[#1f1f1f]"
                }`}
                onClick={() => handleSelectProduct(product._id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-md font-medium truncate text-white">
                        {product.productName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-6 text-xs flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">ID:</span>
                        <span className="text-gray-300 font-medium">
                          {product.productId}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Stock:</span>
                        <span
                          className={`font-bold ${
                            product.stock === 0
                              ? "text-red-500"
                              : "text-yellow-500"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </div>
                      {product.brand && (
                        <div className="flex items-center gap-1 md:flex">
                          <span className="text-gray-500">Brand:</span>
                          <span className="text-gray-300 font-medium truncate max-w-[100px]">
                            {product.brand}
                          </span>
                        </div>
                      )}
                      {product.category && (
                        <span className="hidden lg:inline-block px-2 py-0.5 bg-[#262626] rounded text-xs text-gray-400">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/products?highlight=${product._id}`;
                    }}
                    className="px-3 py-1 bg-white hover:bg-neutral-300 rounded text-xs transition-colors text-[#171717] font-medium whitespace-nowrap flex-shrink-0"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

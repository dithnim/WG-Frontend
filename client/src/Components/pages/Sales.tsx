import React, { useEffect, useState } from "react";
import apiService from "../../services/api";

interface InventoryItem {
  _id: string;
  stock: number;
  cost: number;
  sellingPrice: number;
}

interface SupplierItem {
  _id: string;
  supplierName: string;
}

interface ProductResponse {
  product: {
    _id: string;
    productId: string;
    productName: string;
    sellingPrice: number;
    costPrice: number;
    createdAt: string;
  };
  inventories: InventoryItem[];
  suppliers: SupplierItem[];
}

interface Product {
  _id: string;
  productId: string;
  productName: string;
  sellingPrice: number;
  costPrice: number;
  supplier: string;
  stock: number;
  createdAt: string;
}

interface CartItem {
  _id: string;
  productName: string;
  productId: string;
  sellingPrice: number;
  discountedPrice: number;
  discount: number;
  quantity: number;
  supplier: string;
  costPrice: number;
  stock: number;
}

const Sales = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [productList, setProductList] = useState<CartItem[]>([]);

  const [subTotal, setSubTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [profit, setProfit] = useState(0);

  const [cashIn, setCashIn] = useState(0);
  const [change, setChange] = useState(0);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingField, setEditingField] = useState<{
    index: number;
    field: "quantity" | "sellingPrice" | "discount";
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  const [showCashInModal, setShowCashInModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Calculate totals whenever productList changes
  useEffect(() => {
    calculateTotals();
  }, [productList]);

  const calculateTotals = () => {
    let newSubTotal = 0;
    let newDiscount = 0;
    let newCost = 0;
    let newProfit = 0;

    productList.forEach((item) => {
      const itemTotal = item.sellingPrice * item.quantity;
      const itemCost = item.costPrice * item.quantity;
      const itemDiscount = (item.discount || 0) * item.quantity;

      newSubTotal += itemTotal;
      newDiscount += itemDiscount;
      newCost += itemCost;
      newProfit += (item.discountedPrice - item.costPrice) * item.quantity;
    });

    setSubTotal(newSubTotal);
    setTotalDiscount(newDiscount);
    setGrandTotal(newSubTotal - newDiscount);
    setTotalCost(newCost);
    setProfit(newProfit);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    if (event.target.value) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const fetchProducts = async () => {
    if (!searchQuery) {
      setShowSearchResults(false);
      return;
    }

    setLoading(true);
    try {
      // Use cancelKey to cancel previous search requests when new one is made
      const data = await apiService.get(
        "/product",
        { search: searchQuery },
        {
          cancelKey: "product-search",
          cache: true,
          cacheTTL: 10000, // 10 second cache for search results
        }
      );
      console.log("Product search response:", data);

      // Parse the response - backend returns array of {product, inventories, suppliers}
      let productList: Product[] = [];

      if (Array.isArray(data)) {
        productList = data.map((item: ProductResponse | any) => {
          // Check if it's the new format with product/inventories/suppliers
          if (item.product && item.inventories !== undefined) {
            const totalStock = item.inventories.reduce(
              (sum: number, inv: InventoryItem) => sum + (inv.stock || 0),
              0
            );
            const avgCost =
              item.inventories.length > 0
                ? item.inventories.reduce(
                    (sum: number, inv: InventoryItem) => sum + (inv.cost || 0),
                    0
                  ) / item.inventories.length
                : item.product.costPrice || 0;
            const supplierName = item.suppliers?.[0]?.supplierName || "Unknown";

            return {
              _id: item.product._id,
              productId: item.product.productId,
              productName: item.product.productName,
              sellingPrice:
                item.inventories?.[0]?.sellingPrice ||
                item.product.sellingPrice ||
                0,
              costPrice: avgCost,
              supplier: supplierName,
              stock: totalStock,
              createdAt: item.product.createdAt,
            };
          }
          // Fallback for old format or direct product objects
          return item;
        });
      } else if (data.products) {
        productList = data.products;
      }

      console.log("Parsed products:", productList);
      setProducts(productList);
      setShowSearchResults(true);
    } catch (error: any) {
      // Ignore cancellation errors (happens when user types fast)
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return;
      }
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        fetchProducts();
      }
    }, 250); // Reduced debounce from 300ms to 250ms for faster response

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleProductClick = (product: Product) => {
    console.log("Selected product:", product);

    // Check if product has stock
    if (product.stock <= 0) {
      alert("This product is out of stock");
      return;
    }

    // Check if product already exists in cart
    const existingIndex = productList.findIndex(
      (item) => item.productId === product.productId
    );

    if (existingIndex !== -1) {
      // Check if we can add more (current cart quantity < available stock)
      const currentCartQty = productList[existingIndex].quantity;
      if (currentCartQty >= product.stock) {
        alert(`Cannot add more. Only ${product.stock} in stock.`);
        return;
      }
      // Increase quantity if already in cart
      increaseQuantity(existingIndex, product.stock);
    } else {
      // Add new product to cart
      const newItem: CartItem = {
        _id: product._id,
        productName: product.productName,
        productId: product.productId,
        sellingPrice: product.sellingPrice,
        discountedPrice: product.sellingPrice,
        discount: 0,
        quantity: 1,
        supplier: product.supplier,
        costPrice: product.costPrice,
        stock: product.stock,
      };
      console.log("Adding to cart:", newItem);
      setProductList((prev) => [...prev, newItem]);
    }

    setShowSearchResults(false);
    setSearchQuery("");
  };

  const increaseQuantity = (index: number, maxStock: number) => {
    setProductList((prev) => {
      const newList = [...prev];
      if (newList[index] && newList[index].quantity < maxStock) {
        newList[index] = {
          ...newList[index],
          quantity: newList[index].quantity + 1,
        };
      }
      return newList;
    });
  };

  const decreaseQuantity = (index: number) => {
    setProductList((prev) => {
      const newList = [...prev];
      if (newList[index] && newList[index].quantity > 1) {
        newList[index] = {
          ...newList[index],
          quantity: newList[index].quantity - 1,
        };
      }
      return newList;
    });
  };

  const deleteProduct = (productId: string) => {
    setProductList((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  };

  const startEditing = (
    index: number,
    field: "quantity" | "sellingPrice" | "discount",
    currentValue: number
  ) => {
    setEditingField({ index, field });
    setEditValue(currentValue.toString());
  };

  const saveEdit = () => {
    if (!editingField) return;

    const { index, field } = editingField;
    const value = parseFloat(editValue) || 0;

    setProductList((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          if (field === "quantity") {
            const newQuantity = Math.max(1, Math.min(value, item.stock));
            return { ...item, quantity: Math.floor(newQuantity) };
          } else if (field === "sellingPrice") {
            return {
              ...item,
              sellingPrice: value,
              discountedPrice: value - item.discount,
            };
          } else if (field === "discount") {
            return {
              ...item,
              discount: value,
              discountedPrice: item.sellingPrice - value,
            };
          }
        }
        return item;
      })
    );

    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const handleCheckout = () => {
    if (productList.length === 0) {
      alert("Please add products to cart first");
      return;
    }
    setCashIn(0);
    setChange(0);
    setShowCashInModal(true);
  };

  const handleCashInChange = (value: number) => {
    setCashIn(value);
    const changeAmount = value - grandTotal;
    setChange(changeAmount > 0 ? changeAmount : 0);
  };

  const submitSale = async () => {
    if (cashIn < grandTotal) {
      alert("Insufficient cash amount");
      return;
    }

    setSubmitting(true);
    try {
      const saleData = {
        products: productList.map((product) => ({
          productId: product._id || product.productId, // Use MongoDB _id if available, fallback to productId
          productName: product.productName,
          quantity: product.quantity,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          discount: product.discount,
          subTotal: product.discountedPrice * product.quantity,
        })),
        subTotal: subTotal,
        globalDiscount: totalDiscount,
        grandTotal: grandTotal,
        paymentMethod: "cash",
        amountPaid: cashIn,
        changeAmount: change,
      };

      console.log("Submitting sale data:", JSON.stringify(saleData, null, 2));

      const response = await apiService.post("/sales", saleData);
      console.log("Sale response:", response);

      // Reset the cart after successful sale
      setProductList([]);
      setShowCashInModal(false);
      setCashIn(0);
      setChange(0);
      alert("Sale completed successfully!");
    } catch (error: any) {
      console.error("Error creating sale:", error);
      console.error("Error response:", error.response?.data);
      alert(
        `Failed to complete sale: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearCart = () => {
    setProductList([]);
  };

  return (
    <div className="sales min-h-screen flex flex-col lg:flex-row gap-4 p-4 md:p-6">
      {/* Cash In Modal */}
      {showCashInModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md mx-4"
            style={{
              background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
              boxShadow:
                "0 0 30px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <h2
              className="text-xl font-bold mb-6"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Complete Payment
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal:</span>
                <span>Rs. {subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Discount:</span>
                <span className="text-red-400">
                  - Rs. {totalDiscount.toFixed(2)}
                </span>
              </div>
              <div
                className="h-px bg-neutral-700"
                style={{ background: "rgba(255, 255, 255, 0.1)" }}
              ></div>
              <div className="flex justify-between text-xl font-bold">
                <span>Grand Total:</span>
                <span className="text-green-400">
                  Rs. {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-2">
                Cash Received
              </label>
              <input
                type="number"
                className="w-full text-white text-lg rounded-lg p-3 focus:outline-none transition-all duration-300"
                placeholder="Enter amount..."
                value={cashIn || ""}
                onChange={(e) =>
                  handleCashInChange(parseFloat(e.target.value) || 0)
                }
                autoFocus
                style={{
                  background:
                    "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                }}
              />
            </div>

            {cashIn > 0 && (
              <div
                className={`p-4 rounded-lg mb-6 ${change >= 0 ? "bg-green-900/30 border border-green-700" : "bg-red-900/30 border border-red-700"}`}
              >
                <div className="flex justify-between text-lg font-semibold">
                  <span>Change:</span>
                  <span
                    className={change >= 0 ? "text-green-400" : "text-red-400"}
                  >
                    Rs. {change.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-3 rounded-full transition-all duration-300 font-medium hover:scale-[1.02]"
                onClick={() => setShowCashInModal(false)}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(75, 85, 99, 0.3) 0%, rgba(75, 85, 99, 0.1) 100%)",
                  border: "1px solid rgba(156, 163, 175, 0.3)",
                  boxShadow: "0 0 10px rgba(156, 163, 175, 0.1)",
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 rounded-full transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                onClick={submitSale}
                disabled={submitting || cashIn < grandTotal}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.3) 100%)",
                  border: "1px solid rgba(34, 197, 94, 0.5)",
                  boxShadow: "0 0 15px rgba(34, 197, 94, 0.2)",
                  color: "#4ade80",
                }}
              >
                {submitting ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Side - Search and Product List */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="flex">
            <input
              type="text"
              placeholder="Search products by name or ID..."
              className="flex-1 text-white rounded-l-xl px-5 py-3 focus:outline-none transition-all duration-300"
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                background: "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRight: "none",
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
              }}
            />
            <button
              className="text-white px-5 rounded-r-xl transition-all duration-300 hover:scale-105"
              onClick={fetchProducts}
              style={{
                background: "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderLeft: "none",
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
              }}
            >
              <i
                className="bx bx-search-alt-2 text-xl"
                style={{
                  filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))",
                }}
              ></i>
            </button>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div
              className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl z-40 max-h-80 overflow-y-auto"
              style={{
                background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)",
              }}
            >
              {loading ? (
                <div className="p-4 text-center text-neutral-400">
                  <i className="bx bx-loader-alt bx-spin text-2xl"></i>
                  <p className="mt-2">Searching...</p>
                </div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product._id}
                    className={`p-3 border-b border-neutral-700/50 last:border-0 transition-colors ${
                      product.stock > 0
                        ? "hover:bg-[#252525] cursor-pointer"
                        : "opacity-50 cursor-not-allowed bg-[#1a1a1a]"
                    }`}
                    onClick={() =>
                      product.stock > 0 && handleProductClick(product)
                    }
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p
                          className={`font-medium ${product.stock <= 0 ? "text-neutral-500" : ""}`}
                        >
                          {product.productName}
                        </p>
                        <p className="text-sm text-neutral-400">
                          {product.productId} • {product.supplier}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${product.stock > 0 ? "text-green-400" : "text-neutral-500"}`}
                        >
                          Rs. {product.sellingPrice}
                        </p>
                        <p
                          className={`text-xs ${product.stock > 0 ? "text-neutral-500" : "text-red-400 font-medium"}`}
                        >
                          {product.stock > 0
                            ? `Stock: ${product.stock}`
                            : "Out of Stock"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-neutral-400">
                  No products found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Table */}
        <div
          className="flex-1 rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow:
              "0 0 20px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
        >
          <div
            className="p-4 flex justify-between items-center"
            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}
          >
            <h2
              className="text-lg font-bold"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Products in Cart ({productList.length})
            </h2>
            {productList.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm flex items-center gap-1 transition-all duration-300 hover:scale-105"
                style={{
                  color: "#f87171",
                  filter: "drop-shadow(0 0 4px rgba(248, 113, 113, 0.4))",
                }}
              >
                <i className="bx bx-trash"></i> Clear All
              </button>
            )}
          </div>

          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            {productList.length > 0 ? (
              <table className="w-full">
                <thead className="bg-[#252525] sticky top-0">
                  <tr className="text-neutral-400 text-sm">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Selling Price</th>
                    <th className="px-4 py-3 text-right">Discount</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map((product, index) => (
                    <tr
                      key={product.productId}
                      className="border-b border-neutral-700/50 hover:bg-[#1f1f1f]"
                    >
                      <td className="px-4 py-3 text-neutral-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-xs text-neutral-500">
                          {product.supplier}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {editingField?.index === index &&
                        editingField?.field === "quantity" ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            onBlur={saveEdit}
                            autoFocus
                            min={1}
                            max={product.stock}
                            className="w-16 bg-[#252525] border border-blue-500 rounded px-2 py-1 text-center"
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => decreaseQuantity(index)}
                              className="w-7 h-7 rounded-full bg-[#252525] hover:bg-[#303030] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={product.quantity <= 1}
                            >
                              <i className="bx bx-minus text-sm"></i>
                            </button>
                            <span
                              className="w-8 text-center font-medium cursor-pointer hover:text-blue-400 hover:underline"
                              onClick={() =>
                                startEditing(
                                  index,
                                  "quantity",
                                  product.quantity
                                )
                              }
                              title="Click to edit"
                            >
                              {product.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(index, product.stock)
                              }
                              className="w-7 h-7 rounded-full bg-[#252525] hover:bg-[#303030] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={product.quantity >= product.stock}
                            >
                              <i className="bx bx-plus text-sm"></i>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-400">
                        Rs. {product.costPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingField?.index === index &&
                        editingField?.field === "sellingPrice" ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            onBlur={saveEdit}
                            autoFocus
                            step="0.01"
                            className="w-24 bg-[#252525] border border-blue-500 rounded px-2 py-1 text-right"
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-blue-400"
                            onClick={() =>
                              startEditing(
                                index,
                                "sellingPrice",
                                product.sellingPrice
                              )
                            }
                            title="Click to edit"
                          >
                            Rs. {product.sellingPrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-red-400">
                        {editingField?.index === index &&
                        editingField?.field === "discount" ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            onBlur={saveEdit}
                            autoFocus
                            step="0.01"
                            min={0}
                            className="w-24 bg-[#252525] border border-blue-500 rounded px-2 py-1 text-right"
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-blue-400"
                            onClick={() =>
                              startEditing(index, "discount", product.discount)
                            }
                            title="Click to edit"
                          >
                            - Rs.{" "}
                            {(product.discount * product.quantity).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-400">
                        Rs.{" "}
                        {(product.discountedPrice * product.quantity).toFixed(
                          2
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => deleteProduct(product.productId)}
                            className="text-red-400 hover:text-red-300"
                            title="Remove item"
                          >
                            <i className="bx bx-trash text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                <i className="bx bx-cart text-6xl mb-4"></i>
                <p className="text-lg">No products in cart</p>
                <p className="text-sm">
                  Search and add products to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Cart Summary */}
      <div
        className="w-full lg:w-80 rounded-xl p-5 flex flex-col"
        style={{
          background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow:
            "0 0 20px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-bold"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Order Summary
          </h2>
          <span
            className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{
              background: "rgba(255, 99, 0, 0.2)",
              border: "1px solid rgba(255, 99, 0, 0.5)",
              color: "#ff9500",
              boxShadow: "0 0 8px rgba(255, 99, 0, 0.2)",
            }}
          >
            {productList.length} items
          </span>
        </div>

        <div
          className="h-px mb-4"
          style={{ background: "rgba(255, 255, 255, 0.1)" }}
        ></div>

        {/* Quick Stats */}
        <div className="space-y-3 flex-1">
          <div className="flex justify-between">
            <span className="text-neutral-400">Subtotal</span>
            <span>Rs. {subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Total Discount</span>
            <span className="text-red-400">
              - Rs. {totalDiscount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Total Cost</span>
            <span className="text-neutral-500">Rs. {totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Expected Profit</span>
            <span className={profit >= 0 ? "text-green-400" : "text-red-400"}>
              Rs. {profit.toFixed(2)}
            </span>
          </div>
        </div>

        <div
          className="h-px my-4"
          style={{ background: "rgba(255, 255, 255, 0.1)" }}
        ></div>

        {/* Grand Total */}
        <div className="flex justify-between text-xl font-bold mb-6">
          <span>Grand Total</span>
          <span className="text-green-400">Rs. {grandTotal.toFixed(2)}</span>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={productList.length === 0}
          className="w-full py-3 font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 0 15px rgba(255, 255, 255, 0.1)",
            color: "#fff",
          }}
        >
          <i className="bx bx-credit-card text-xl"></i>
          Checkout
        </button>
      </div>
    </div>
  );
};

export default Sales;

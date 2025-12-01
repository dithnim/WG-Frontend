import React, { useEffect, useState } from "react";
import apiService from "../../services/api";

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [newDiscount, setNewDiscount] = useState("");

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
      const data = await apiService.get("/product", { search: searchQuery });
      setProducts(Array.isArray(data) ? data : data.products || []);
      setShowSearchResults(true);
    } catch (error) {
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
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleProductClick = (product: Product) => {
    // Check if product already exists in cart
    const existingIndex = productList.findIndex(
      (item) => item.productId === product.productId
    );

    if (existingIndex !== -1) {
      // Increase quantity if already in cart
      increaseQuantity(existingIndex, product.stock);
    } else {
      // Add new product to cart
      const newItem: CartItem = {
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
      setProductList((prev) => [...prev, newItem]);
    }

    setShowSearchResults(false);
    setSearchQuery("");
  };

  const increaseQuantity = (index: number, maxStock: number) => {
    setProductList((prev) =>
      prev.map((item, idx) => {
        if (idx === index && item.quantity < maxStock) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      })
    );
  };

  const decreaseQuantity = (index: number) => {
    setProductList((prev) =>
      prev.map((item, idx) => {
        if (idx === index && item.quantity > 1) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      })
    );
  };

  const deleteProduct = (productId: string) => {
    setProductList((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  };

  const handleEditPrice = (index: number) => {
    setEditingIndex(index);
    setNewPrice(productList[index].sellingPrice.toString());
    setNewDiscount((productList[index].discount || 0).toString());
  };

  const saveNewPrice = (index: number) => {
    setProductList((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const updatedPrice = parseFloat(newPrice) || item.sellingPrice;
          const updatedDiscount = parseFloat(newDiscount) || 0;
          return {
            ...item,
            sellingPrice: updatedPrice,
            discount: updatedDiscount,
            discountedPrice: updatedPrice - updatedDiscount,
          };
        }
        return item;
      })
    );
    setEditingIndex(null);
    setNewPrice("");
    setNewDiscount("");
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
          productId: product.productId,
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

      await apiService.post("/sales", saleData);

      // Reset the cart after successful sale
      setProductList([]);
      setShowCashInModal(false);
      setCashIn(0);
      setChange(0);
      alert("Sale completed successfully!");
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Failed to complete sale. Please try again.");
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-[#171717] rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700">
            <h2 className="text-xl font-bold mb-6">Complete Payment</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal:</span>
                <span>Rs. {subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Discount:</span>
                <span className="text-red-400">
                  - Rs. {totalDiscount.toFixed(2)}
                </span>
              </div>
              <div className="h-px bg-gray-700"></div>
              <div className="flex justify-between text-xl font-bold">
                <span>Grand Total:</span>
                <span className="text-green-400">
                  Rs. {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Cash Received
              </label>
              <input
                type="number"
                className="w-full bg-[#252525] border border-gray-600 text-white text-lg rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount..."
                value={cashIn || ""}
                onChange={(e) =>
                  handleCashInChange(parseFloat(e.target.value) || 0)
                }
                autoFocus
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
                className="flex-1 px-4 py-3 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors font-medium"
                onClick={() => setShowCashInModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={submitSale}
                disabled={submitting || cashIn < grandTotal}
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
              className="flex-1 bg-[#171717] text-white rounded-l-xl px-5 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button
              className="bg-[#252525] hover:bg-[#303030] text-white px-5 rounded-r-xl border border-l-0 border-gray-700 transition-colors"
              onClick={fetchProducts}
            >
              <i className="bx bx-search-alt-2 text-xl"></i>
            </button>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#171717] border border-gray-700 rounded-xl shadow-2xl z-40 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">
                  <i className="bx bx-loader-alt bx-spin text-2xl"></i>
                  <p className="mt-2">Searching...</p>
                </div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product._id}
                    className="p-3 hover:bg-[#252525] cursor-pointer border-b border-gray-700/50 last:border-0 transition-colors"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-gray-400">
                          {product.productId} • {product.supplier}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">
                          Rs. {product.sellingPrice}
                        </p>
                        <p className="text-xs text-gray-500">
                          Stock: {product.stock}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">
                  No products found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Table */}
        <div className="flex-1 bg-[#171717] rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-bold">
              Products in Cart ({productList.length})
            </h2>
            {productList.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
              >
                <i className="bx bx-trash"></i> Clear All
              </button>
            )}
          </div>

          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            {productList.length > 0 ? (
              <table className="w-full">
                <thead className="bg-[#252525] sticky top-0">
                  <tr className="text-gray-400 text-sm">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Discount</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map((product, index) => (
                    <tr
                      key={product.productId}
                      className="border-b border-gray-700/50 hover:bg-[#1f1f1f]"
                    >
                      <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-xs text-gray-500">
                          {product.supplier}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => decreaseQuantity(index)}
                            className="w-7 h-7 rounded-full bg-[#252525] hover:bg-[#303030] flex items-center justify-center transition-colors"
                          >
                            <i className="bx bx-minus text-sm"></i>
                          </button>
                          <span className="w-8 text-center font-medium">
                            {product.quantity}
                          </span>
                          <button
                            onClick={() =>
                              increaseQuantity(index, product.stock)
                            }
                            className="w-7 h-7 rounded-full bg-[#252525] hover:bg-[#303030] flex items-center justify-center transition-colors"
                            disabled={product.quantity >= product.stock}
                          >
                            <i className="bx bx-plus text-sm"></i>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingIndex === index ? (
                          <input
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            className="w-20 bg-[#252525] border border-gray-600 rounded px-2 py-1 text-right"
                          />
                        ) : (
                          `Rs. ${product.sellingPrice.toFixed(2)}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-red-400">
                        {editingIndex === index ? (
                          <input
                            type="number"
                            value={newDiscount}
                            onChange={(e) => setNewDiscount(e.target.value)}
                            className="w-20 bg-[#252525] border border-gray-600 rounded px-2 py-1 text-right"
                          />
                        ) : (
                          `- Rs. ${(product.discount * product.quantity).toFixed(2)}`
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
                          {editingIndex === index ? (
                            <>
                              <button
                                onClick={() => saveNewPrice(index)}
                                className="text-green-400 hover:text-green-300"
                              >
                                <i className="bx bx-check text-xl"></i>
                              </button>
                              <button
                                onClick={() => setEditingIndex(null)}
                                className="text-gray-400 hover:text-gray-300"
                              >
                                <i className="bx bx-x text-xl"></i>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditPrice(index)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <i className="bx bx-edit text-lg"></i>
                              </button>
                              <button
                                onClick={() => deleteProduct(product.productId)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <i className="bx bx-trash text-lg"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
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
      <div className="w-full lg:w-80 bg-[#171717] rounded-xl border border-gray-700 p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Order Summary</h2>
          <span className="text-xs bg-orange-600 px-2 py-1 rounded-full">
            {productList.length} items
          </span>
        </div>

        <div className="h-px bg-gray-700 mb-4"></div>

        {/* Quick Stats */}
        <div className="space-y-3 flex-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal</span>
            <span>Rs. {subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Discount</span>
            <span className="text-red-400">
              - Rs. {totalDiscount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Cost</span>
            <span className="text-gray-500">Rs. {totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Expected Profit</span>
            <span className={profit >= 0 ? "text-green-400" : "text-red-400"}>
              Rs. {profit.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="h-px bg-gray-700 my-4"></div>

        {/* Grand Total */}
        <div className="flex justify-between text-xl font-bold mb-6">
          <span>Grand Total</span>
          <span className="text-green-400">Rs. {grandTotal.toFixed(2)}</span>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={productList.length === 0}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <i className="bx bx-credit-card text-xl"></i>
          Checkout
        </button>
      </div>
    </div>
  );
};

export default Sales;

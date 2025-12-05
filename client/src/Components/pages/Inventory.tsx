import React, { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchProductsWithInventories,
  createInventoryForProduct,
  updateInventory,
  deleteInventory,
  createProduct,
  updateProduct,
  searchProductByProductId,
  optimisticUpdateInventory,
  optimisticAddInventory,
  optimisticDeleteInventory,
  replaceTempInventory,
  revertInventoryState,
  optimisticUpdateProduct,
  setSelectedProduct,
  setSearchQuery,
  setIsSearchingApi,
  setApiSearchDone,
  setShowAddInventoryModal,
  setShowAddProductModal,
  setShowEditProductModal,
  setEditingInventory,
  setNewInventory,
  updateNewInventoryField,
  resetNewInventory,
  setNewProduct,
  updateNewProductField,
  resetNewProduct,
  setEditProduct,
  updateEditProductField,
  initEditProductFromSelected,
  Inventory as InventoryType,
  ProductWithInventories,
} from "../../store/inventorySlice";

const Inventory = () => {
  const dispatch = useAppDispatch();
  const {
    productsWithInventories,
    loading,
    error,
    selectedProduct,
    searchQuery,
    isSearchingApi,
    apiSearchDone,
    showAddInventoryModal,
    showAddProductModal,
    showEditProductModal,
    editingInventory,
    newInventory,
    newProduct,
    editProduct,
  } = useAppSelector((state) => state.inventory);

  // Ref for search input
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Load all data on mount
  useEffect(() => {
    dispatch(fetchProductsWithInventories());
  }, [dispatch]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P: Open Add Product modal
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        dispatch(setShowAddProductModal(true));
      }
      // Ctrl+I: Open Add Inventory modal (only if a product is selected)
      if (e.ctrlKey && e.key === "i") {
        e.preventDefault();
        if (selectedProduct) {
          dispatch(resetNewInventory());
          dispatch(setShowAddInventoryModal(true));
        }
      }
      // Ctrl+S: Focus search box
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProduct, dispatch]);

  // Update selected product when productsWithInventories changes
  useEffect(() => {
    if (selectedProduct) {
      const updated = productsWithInventories.find(
        (p) => p._id === selectedProduct._id
      );
      if (updated) {
        dispatch(setSelectedProduct(updated));
      }
    }
  }, [productsWithInventories, dispatch]);

  const filteredProducts = productsWithInventories.filter((product) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const productName = (product.productName || "").toLowerCase();
    const productId = (product.productId || "").toLowerCase();
    const brand = (product.brand || "").toLowerCase();
    const category = (product.category || "").toLowerCase();

    return (
      productName.includes(query) ||
      productId.includes(query) ||
      brand.includes(query) ||
      category.includes(query)
    );
  });

  // Debounced API search when no local results found
  useEffect(() => {
    const query = searchQuery.trim();

    // Reset API search state when query changes
    dispatch(setApiSearchDone(false));

    // Don't search if query is empty or too short
    if (!query || query.length < 2) {
      dispatch(setIsSearchingApi(false));
      return;
    }

    // Check if we have local results by filtering again (to avoid dependency on filteredProducts)
    const hasLocalResults = productsWithInventories.some((product) => {
      const q = query.toLowerCase();
      const productName = (product.productName || "").toLowerCase();
      const productId = (product.productId || "").toLowerCase();
      const brand = (product.brand || "").toLowerCase();
      const category = (product.category || "").toLowerCase();

      return (
        productName.includes(q) ||
        productId.includes(q) ||
        brand.includes(q) ||
        category.includes(q)
      );
    });

    // If we have local results, don't search API
    if (hasLocalResults) {
      dispatch(setIsSearchingApi(false));
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      dispatch(setIsSearchingApi(true));
      try {
        await dispatch(searchProductByProductId(query)).unwrap();
      } catch (err) {
        // Error is handled by the slice
      } finally {
        dispatch(setIsSearchingApi(false));
        dispatch(setApiSearchDone(true));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, productsWithInventories, dispatch]);

  const handleAddInventory = async () => {
    if (!selectedProduct) return;

    const cost = parseFloat(newInventory.cost);
    const sellingPrice = parseFloat(newInventory.sellingPrice);
    const stock = parseInt(newInventory.stock);

    if (isNaN(cost) || isNaN(sellingPrice) || isNaN(stock)) {
      alert("Please enter valid numbers for all fields");
      return;
    }

    // Store previous state for rollback
    const previousState = [...productsWithInventories];

    // Create a temporary inventory object for optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempInventory: InventoryType = {
      _id: tempId,
      cost,
      sellingPrice,
      stock,
      createdAt: new Date().toISOString(),
    };

    // Optimistically add the inventory
    dispatch(
      optimisticAddInventory({
        productId: selectedProduct._id,
        inventory: tempInventory,
      })
    );

    // Close modal immediately
    dispatch(setShowAddInventoryModal(false));

    // Perform API call in background
    try {
      const result = await dispatch(
        createInventoryForProduct({
          productId: selectedProduct._id,
          cost,
          sellingPrice,
          stock,
        })
      ).unwrap();

      // Debug: Log API response to see what we're getting
      console.log("Create inventory API result:", result);
      console.log("Inventory from API:", result.inventory);
      console.log("createdAt value:", result.inventory?.createdAt);

      // Replace temp inventory with real one (no refetch needed)
      dispatch(
        replaceTempInventory({
          productId: selectedProduct._id,
          tempId,
          realInventory: {
            ...result.inventory,
            createdAt: result.inventory.createdAt || new Date().toISOString(),
          },
        })
      );
    } catch (err) {
      // Revert on failure
      dispatch(revertInventoryState(previousState));
      alert("Failed to add inventory. Please try again.");
    }
  };

  const handleUpdateInventory = async () => {
    if (!editingInventory || !selectedProduct) return;

    const cost = parseFloat(newInventory.cost);
    const sellingPrice = parseFloat(newInventory.sellingPrice);
    const stock = parseInt(newInventory.stock);

    if (isNaN(cost) || isNaN(sellingPrice) || isNaN(stock)) {
      alert("Please enter valid numbers for all fields");
      return;
    }

    // Store previous state for rollback
    const previousState = [
      ...productsWithInventories.map((p) => ({
        ...p,
        inventories: [...p.inventories.map((inv) => ({ ...inv }))],
      })),
    ];

    // Optimistically update the UI
    dispatch(
      optimisticUpdateInventory({
        productId: selectedProduct._id,
        inventoryId: editingInventory._id,
        cost,
        sellingPrice,
        stock,
      })
    );

    // Close modal immediately
    dispatch(setEditingInventory(null));

    // Perform API call in background
    try {
      await dispatch(
        updateInventory({
          inventoryId: editingInventory._id,
          cost,
          sellingPrice,
          stock,
        })
      ).unwrap();
    } catch (err) {
      // Revert on failure
      dispatch(revertInventoryState(previousState));
      alert("Failed to update inventory. Please try again.");
    }
  };

  const handleDeleteInventory = async (inventory: InventoryType) => {
    if (!selectedProduct) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this inventory entry?"
    );
    if (!confirmed) return;

    // Store previous state for rollback
    const previousState = [
      ...productsWithInventories.map((p) => ({
        ...p,
        inventories: [...p.inventories.map((inv) => ({ ...inv }))],
      })),
    ];

    // Optimistically delete from UI
    dispatch(
      optimisticDeleteInventory({
        productId: selectedProduct._id,
        inventoryId: inventory._id,
      })
    );

    // Perform API call in background
    try {
      await dispatch(
        deleteInventory({
          inventoryId: inventory._id,
          linkId: inventory.linkId,
        })
      ).unwrap();
    } catch (err) {
      // Revert on failure
      dispatch(revertInventoryState(previousState));
      alert("Failed to delete inventory. Please try again.");
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.productId || !newProduct.productName) {
      alert("Product ID and Product Name are required");
      return;
    }

    await dispatch(createProduct(newProduct));

    // Refresh data
    await dispatch(fetchProductsWithInventories());

    dispatch(setShowAddProductModal(false));
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    // Store previous state for rollback
    const previousState = [
      ...productsWithInventories.map((p) => ({
        ...p,
        inventories: [...p.inventories.map((inv) => ({ ...inv }))],
      })),
    ];

    // Optimistically update the UI
    dispatch(
      optimisticUpdateProduct({
        productId: selectedProduct._id,
        productName: editProduct.productName,
        brand: editProduct.brand,
        category: editProduct.category,
        rackNumber: editProduct.rackNumber,
        description: editProduct.description,
      })
    );

    // Close modal immediately
    dispatch(setShowEditProductModal(false));

    // Perform API call in background
    try {
      await dispatch(
        updateProduct({
          _id: selectedProduct._id,
          productName: editProduct.productName,
          brand: editProduct.brand,
          category: editProduct.category,
          rackNumber: editProduct.rackNumber,
          description: editProduct.description,
        })
      ).unwrap();
    } catch (err) {
      // Revert on failure
      dispatch(revertInventoryState(previousState));
      alert("Failed to update product. Please try again.");
    }
  };

  const openEditProductModal = () => {
    if (!selectedProduct) return;
    dispatch(initEditProductFromSelected());
    dispatch(setShowEditProductModal(true));
  };

  const openEditInventoryModal = (inventory: InventoryType) => {
    dispatch(setEditingInventory(inventory));
  };

  const getTotalStock = (inventories: InventoryType[]) => {
    return inventories.reduce((sum, inv) => sum + inv.stock, 0);
  };

  const getAverageCost = (inventories: InventoryType[]) => {
    if (inventories.length === 0) return 0;
    const totalCost = inventories.reduce((sum, inv) => sum + inv.cost, 0);
    return totalCost / inventories.length;
  };

  const getAverageSellingPrice = (inventories: InventoryType[]) => {
    if (inventories.length === 0) return 0;
    const totalPrice = inventories.reduce(
      (sum, inv) => sum + inv.sellingPrice,
      0
    );
    return totalPrice / inventories.length;
  };

  return (
    <div className="h-full xl:px-12 px-8 py-2 overflow-y-auto">
      {/* Header */}
      <div className="head py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1
              className="text-3xl font-bold hidden md:flex xl:flex"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
              }}
            >
              Inventory Manager
            </h1>
            <i
              className="bx bxs-package text-2xl"
              style={{
                color: "#ff6300",
                filter: "drop-shadow(0 0 8px rgba(255, 99, 0, 0.6))",
              }}
            ></i>
          </div>
          <button
            onClick={() => dispatch(setShowAddProductModal(true))}
            className="px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 font-semibold hover:scale-[1.02]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 0 15px rgba(255, 255, 255, 0.1)",
              color: "#fff",
            }}
          >
            <i className="bx bx-plus"></i>
            Add Product
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className="px-4 py-3 rounded-lg mt-4"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            boxShadow: "0 0 15px rgba(239, 68, 68, 0.1)",
          }}
        >
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="body mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Products List */}
        <div
          className="lg:col-span-1 rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow:
              "0 0 20px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
        >
          <div className="mb-4">
            <h2
              className="text-xl font-semibold mb-3"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Products
            </h2>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                }}
              />
              <i
                className="bx bx-search absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
                style={{
                  filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))",
                }}
              ></i>
            </div>
          </div>

          {loading && !productsWithInventories.length ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  onClick={() => dispatch(setSelectedProduct(product))}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedProduct?._id === product._id
                      ? "bg-[#303030] border border-neutral-500"
                      : "bg-[#262626] hover:bg-[#303030]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{product.productName}</h3>
                      <p className="text-sm text-neutral-400">
                        ID: {product.productId}
                      </p>
                      {product.brand && (
                        <p className="text-xs text-neutral-500">
                          Brand: {product.brand}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-1 rounded ${
                          product.inventories.length > 0
                            ? "bg-blue-600/30 border border-blue-600/60 text-blue-400 rounded-full"
                            : "bg-neutral-600/30 border border-neutral-600/60 text-neutral-400 rounded-full"
                        }`}
                      >
                        {product.inventories.length} entries
                      </span>
                      <p className="text-xs text-neutral-400 mt-1">
                        Stock: {getTotalStock(product.inventories)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center text-neutral-400 py-8">
                  {isSearchingApi ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div>
                      <p>Searching database...</p>
                    </div>
                  ) : searchQuery.trim() && apiSearchDone ? (
                    <div>
                      <i className="bx bx-search-alt text-3xl mb-2"></i>
                      <p>No products found for "{searchQuery}"</p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Try a different search term
                      </p>
                    </div>
                  ) : (
                    "No products found"
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Details & Inventories */}
        <div
          className="lg:col-span-2 rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow:
              "0 0 20px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
        >
          {selectedProduct ? (
            <>
              {/* Product Info Header */}
              <div
                className="flex justify-between items-start mb-6 pb-4"
                style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}
              >
                <div>
                  <h2
                    className="text-2xl font-bold"
                    style={{
                      background:
                        "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {selectedProduct.productName}
                  </h2>
                  <p className="text-neutral-400">
                    Product ID: {selectedProduct.productId}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    {selectedProduct.brand && (
                      <span className="bg-purple-600/30 border border-purple-600/60 text-purple-400 px-2 rounded-full text-sm">
                        {selectedProduct.brand}
                      </span>
                    )}
                    {selectedProduct.category && (
                      <span className="bg-blue-600/30 border border-blue-600/60 text-blue-400 px-2 rounded-full text-sm">
                        {selectedProduct.category}
                      </span>
                    )}
                    {selectedProduct.rackNumber && (
                      <span className="bg-orange-600/30 border border-orange-600/60 text-orange-400 px-2 rounded-full text-sm">
                        Rack: {selectedProduct.rackNumber}
                      </span>
                    )}
                  </div>
                  {selectedProduct.description && (
                    <p className="text-sm text-neutral-400 mt-2">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openEditProductModal}
                    className="text-white px-3 py-2 rounded-full transition-all duration-300 flex items-center gap-2 font-semibold hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(75, 85, 99, 0.3) 0%, rgba(75, 85, 99, 0.1) 100%)",
                      border: "1px solid rgba(156, 163, 175, 0.3)",
                      boxShadow: "0 0 10px rgba(156, 163, 175, 0.1)",
                    }}
                  >
                    <i className="bx bx-edit text"></i>
                  </button>
                  <button
                    onClick={() => {
                      dispatch(resetNewInventory());
                      dispatch(setShowAddInventoryModal(true));
                    }}
                    className="px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 font-semibold hover:scale-[1.02]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      boxShadow: "0 0 15px rgba(255, 255, 255, 0.1)",
                      color: "#fff",
                    }}
                  >
                    <i className="bx bx-plus"></i>
                    Add Inventory
                  </button>
                </div>
              </div>

              {/* Inventory Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                    boxShadow: "0 0 15px rgba(34, 197, 94, 0.1)",
                  }}
                >
                  <p className="text-neutral-400 text-sm">Total Stock</p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: "#4ade80",
                      textShadow: "0 0 10px rgba(74, 222, 128, 0.4)",
                    }}
                  >
                    {getTotalStock(selectedProduct.inventories)}
                  </p>
                </div>
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    boxShadow: "0 0 15px rgba(59, 130, 246, 0.1)",
                  }}
                >
                  <p className="text-neutral-400 text-sm">Inventory Entries</p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: "#60a5fa",
                      textShadow: "0 0 10px rgba(96, 165, 250, 0.4)",
                    }}
                  >
                    {selectedProduct.inventories.length}
                  </p>
                </div>
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(234, 179, 8, 0.2)",
                    boxShadow: "0 0 15px rgba(234, 179, 8, 0.1)",
                  }}
                >
                  <p className="text-neutral-400 text-sm">Avg. Cost</p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: "#facc15",
                      textShadow: "0 0 10px rgba(250, 204, 21, 0.4)",
                    }}
                  >
                    Rs.{getAverageCost(selectedProduct.inventories).toFixed(2)}
                  </p>
                </div>
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(168, 85, 247, 0.2)",
                    boxShadow: "0 0 15px rgba(168, 85, 247, 0.1)",
                  }}
                >
                  <p className="text-neutral-400 text-sm">Avg. Selling Price</p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: "#c084fc",
                      textShadow: "0 0 10px rgba(192, 132, 252, 0.4)",
                    }}
                  >
                    Rs.
                    {getAverageSellingPrice(
                      selectedProduct.inventories
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Inventory Table */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Inventory Entries
                </h3>
                {selectedProduct.inventories.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-neutral-400 border-b border-neutral-700">
                          <th className="pb-3 px-2">#</th>
                          <th className="pb-3 px-2">Cost</th>
                          <th className="pb-3 px-2">Selling Price</th>
                          <th className="pb-3 px-2">Stock</th>
                          <th className="pb-3 px-2">Profit Margin</th>
                          <th className="pb-3 px-2">Created</th>
                          <th className="pb-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProduct.inventories.map((inventory, index) => {
                          // Debug: log inventory to see if createdAt exists
                          console.log("Inventory item:", inventory);
                          const profitMargin =
                            ((inventory.sellingPrice - inventory.cost) /
                              inventory.cost) *
                            100;
                          return (
                            <tr
                              key={inventory._id}
                              className="border-b border-neutral-700 hover:bg-[#262626]/50"
                            >
                              <td className="py-3 px-2">{index + 1}</td>
                              <td className="py-3 px-2">
                                Rs.{inventory.cost.toFixed(2)}
                              </td>
                              <td className="py-3 px-2">
                                Rs.{inventory.sellingPrice.toFixed(2)}
                              </td>
                              <td className="py-3 px-2">
                                <span
                                  className={`px-2 py-1 rounded ${
                                    inventory.stock > 1
                                      ? "text-green-400"
                                      : inventory.stock > 0
                                        ? "text-yellow-400"
                                        : "text-red-400"
                                  }`}
                                >
                                  {inventory.stock}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <span
                                  className={`${
                                    profitMargin > 2
                                      ? "text-green-400"
                                      : profitMargin > 0
                                        ? "text-yellow-400"
                                        : "text-red-400"
                                  }`}
                                >
                                  {profitMargin.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-3 px-2 text-neutral-400 text-sm">
                                {inventory.createdAt
                                  ? new Date(
                                      inventory.createdAt
                                    ).toLocaleDateString()
                                  : selectedProduct.createdAt
                                    ? new Date(
                                        selectedProduct.createdAt
                                      ).toLocaleDateString()
                                    : "N/A"}
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex gap-2">
                                  <i
                                    className="bx bxs-pencil text-lg cursor-pointer text-neutral-300 hover:text-white transition-colors"
                                    onClick={() =>
                                      openEditInventoryModal(inventory)
                                    }
                                    title="Edit"
                                  ></i>
                                  <i
                                    className="bx bxs-trash text-lg cursor-pointer text-[#a10000] hover:text-red-500 transition-colors"
                                    onClick={() =>
                                      handleDeleteInventory(inventory)
                                    }
                                    title="Delete"
                                  ></i>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 py-8 bg-[#262626] rounded-lg">
                    <i className="bx bx-package text-4xl mb-2"></i>
                    <p>No inventory entries for this product</p>
                    <p className="text-sm">
                      Click "Add Inventory" to create one
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-16">
              <i className="bx bx-select-multiple text-6xl mb-4"></i>
              <p className="text-xl">Select a product to view inventories</p>
              <p className="text-sm">
                Choose a product from the list on the left
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Inventory Modal */}
      {showAddInventoryModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") dispatch(setShowAddInventoryModal(false));
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddInventory();
            }
          }}
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
            <div className="flex justify-between items-center mb-4">
              <h3
                className="text-xl font-bold"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Add Inventory Entry
              </h3>
              <button
                onClick={() => dispatch(setShowAddInventoryModal(false))}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>

            <p className="text-neutral-400 mb-4">
              Adding inventory for:{" "}
              <span className="text-white font-semibold">
                {selectedProduct?.productName}
              </span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Cost Price (Rs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={newInventory.cost}
                  onChange={(e) =>
                    dispatch(
                      updateNewInventoryField({
                        field: "cost",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                  placeholder="0.00"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Selling Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newInventory.sellingPrice}
                  onChange={(e) =>
                    dispatch(
                      updateNewInventoryField({
                        field: "sellingPrice",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                  placeholder="0.00"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={newInventory.stock}
                  onChange={(e) =>
                    dispatch(
                      updateNewInventoryField({
                        field: "stock",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                  placeholder="0"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => dispatch(setShowAddInventoryModal(false))}
                className="flex-1 text-neutral-300 font-medium rounded-lg px-4 py-2 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(38, 38, 38, 0.8) 0%, rgba(23, 23, 23, 0.8) 100%)",
                  border: "1px solid rgba(156, 163, 175, 0.3)",
                  boxShadow: "0 0 10px rgba(156, 163, 175, 0.1)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddInventory}
                disabled={loading}
                className="flex-1 font-medium rounded-lg px-4 py-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 0 15px rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                }}
              >
                {loading ? "Adding..." : "Add Inventory"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inventory Modal */}
      {editingInventory && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              dispatch(setEditingInventory(null));
              dispatch(resetNewInventory());
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleUpdateInventory();
            }
          }}
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
            <div className="flex justify-between items-center mb-4">
              <h3
                className="text-xl font-bold"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Edit Inventory Entry
              </h3>
              <button
                onClick={() => {
                  dispatch(setEditingInventory(null));
                  dispatch(resetNewInventory());
                }}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Cost Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={newInventory.cost}
                  onChange={(e) =>
                    dispatch(
                      updateNewInventoryField({
                        field: "cost",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                  placeholder="0.00"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Selling Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newInventory.sellingPrice}
                  onChange={(e) =>
                    dispatch(
                      updateNewInventoryField({
                        field: "sellingPrice",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                  placeholder="0.00"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={newInventory.stock}
                  onChange={(e) =>
                    dispatch(
                      updateNewInventoryField({
                        field: "stock",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                  placeholder="0"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  dispatch(setEditingInventory(null));
                  dispatch(resetNewInventory());
                }}
                className="flex-1 text-neutral-300 font-medium rounded-lg px-4 py-2 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(38, 38, 38, 0.8) 0%, rgba(23, 23, 23, 0.8) 100%)",
                  border: "1px solid rgba(156, 163, 175, 0.3)",
                  boxShadow: "0 0 10px rgba(156, 163, 175, 0.1)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateInventory}
                disabled={loading}
                className="flex-1 font-medium rounded-lg px-4 py-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 0 15px rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                }}
              >
                {loading ? "Updating..." : "Update Inventory"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") dispatch(setShowAddProductModal(false));
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              e.target instanceof HTMLInputElement
            ) {
              e.preventDefault();
              handleAddProduct();
            }
          }}
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            style={{
              background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
              boxShadow:
                "0 0 30px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className="text-xl font-bold"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Add New Product
              </h3>
              <button
                onClick={() => dispatch(setShowAddProductModal(false))}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Product ID *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={newProduct.productId}
                    onChange={(e) =>
                      dispatch(
                        updateNewProductField({
                          field: "productId",
                          value: e.target.value,
                        })
                      )
                    }
                    className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                    placeholder="SKU-001"
                    style={{
                      background:
                        "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={newProduct.productName}
                    onChange={(e) =>
                      dispatch(
                        updateNewProductField({
                          field: "productName",
                          value: e.target.value,
                        })
                      )
                    }
                    className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                    placeholder="Product Name"
                    style={{
                      background:
                        "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={newProduct.brand}
                    onChange={(e) =>
                      dispatch(
                        updateNewProductField({
                          field: "brand",
                          value: e.target.value,
                        })
                      )
                    }
                    className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                    placeholder="Brand Name"
                    style={{
                      background:
                        "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) =>
                      dispatch(
                        updateNewProductField({
                          field: "category",
                          value: e.target.value,
                        })
                      )
                    }
                    className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                    placeholder="Category"
                    style={{
                      background:
                        "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Rack Number
                </label>
                <input
                  type="text"
                  value={newProduct.rackNumber}
                  onChange={(e) =>
                    dispatch(
                      updateNewProductField({
                        field: "rackNumber",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                  placeholder="A-01"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Description
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    dispatch(
                      updateNewProductField({
                        field: "description",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300 min-h-[80px]"
                  placeholder="Product description..."
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => dispatch(setShowAddProductModal(false))}
                className="flex-1 text-neutral-300 font-medium rounded-lg px-4 py-2 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(38, 38, 38, 0.8) 0%, rgba(23, 23, 23, 0.8) 100%)",
                  border: "1px solid rgba(156, 163, 175, 0.3)",
                  boxShadow: "0 0 10px rgba(156, 163, 175, 0.1)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={loading}
                className="flex-1 font-medium rounded-lg px-4 py-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 0 15px rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                }}
              >
                {loading ? "Creating..." : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && selectedProduct && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") dispatch(setShowEditProductModal(false));
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              e.target instanceof HTMLInputElement
            ) {
              e.preventDefault();
              handleUpdateProduct();
            }
          }}
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            style={{
              background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
              boxShadow:
                "0 0 30px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className="text-xl font-bold"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Edit Product
              </h3>
              <button
                onClick={() => dispatch(setShowEditProductModal(false))}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Product ID
                </label>
                <input
                  type="text"
                  value={editProduct.productId}
                  disabled
                  className="w-full text-neutral-400 px-4 py-2 rounded-lg cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, #252525 0%, #1a1a1a 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Product ID cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={editProduct.productName}
                  onChange={(e) =>
                    dispatch(
                      updateEditProductField({
                        field: "productName",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={editProduct.brand}
                    onChange={(e) =>
                      dispatch(
                        updateEditProductField({
                          field: "brand",
                          value: e.target.value,
                        })
                      )
                    }
                    className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                    style={{
                      background:
                        "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editProduct.category}
                    onChange={(e) =>
                      dispatch(
                        updateEditProductField({
                          field: "category",
                          value: e.target.value,
                        })
                      )
                    }
                    className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                    style={{
                      background:
                        "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Rack Number
                </label>
                <input
                  type="text"
                  value={editProduct.rackNumber}
                  onChange={(e) =>
                    dispatch(
                      updateEditProductField({
                        field: "rackNumber",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Description
                </label>
                <textarea
                  value={editProduct.description}
                  onChange={(e) =>
                    dispatch(
                      updateEditProductField({
                        field: "description",
                        value: e.target.value,
                      })
                    )
                  }
                  className="w-full text-white px-4 py-2 rounded-lg focus:outline-none transition-all duration-300 min-h-[80px]"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => dispatch(setShowEditProductModal(false))}
                className="flex-1 text-neutral-300 font-medium rounded-lg px-4 py-2 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(38, 38, 38, 0.8) 0%, rgba(23, 23, 23, 0.8) 100%)",
                  border: "1px solid rgba(156, 163, 175, 0.3)",
                  boxShadow: "0 0 10px rgba(156, 163, 175, 0.1)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProduct}
                disabled={loading}
                className="flex-1 font-medium rounded-lg px-4 py-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 0 15px rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                }}
              >
                {loading ? "Updating..." : "Update Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiService from "../services/api";

export interface Inventory {
  _id: string;
  cost: number;
  sellingPrice: number;
  stock: number;
  linkId?: string; // product-inventory relationship ID
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  productId: string;
  productName: string;
  brand?: string;
  category?: string;
  rackNumber?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithInventories extends Product {
  inventories: Inventory[];
  suppliers?: any[];
}

export interface NewInventoryForm {
  cost: string;
  sellingPrice: string;
  stock: string;
}

export interface NewProductForm {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  rackNumber: string;
  description: string;
}

interface InventoryState {
  productsWithInventories: ProductWithInventories[];
  loading: boolean;
  error: string | null;
  selectedProduct: ProductWithInventories | null;
  // UI States
  searchQuery: string;
  isSearchingApi: boolean;
  apiSearchDone: boolean;
  showAddInventoryModal: boolean;
  showAddProductModal: boolean;
  showEditProductModal: boolean;
  editingInventory: Inventory | null;
  // Form States
  newInventory: NewInventoryForm;
  newProduct: NewProductForm;
  editProduct: NewProductForm;
}

const initialInventoryForm: NewInventoryForm = {
  cost: "",
  sellingPrice: "",
  stock: "",
};

const initialProductForm: NewProductForm = {
  productId: "",
  productName: "",
  brand: "",
  category: "",
  rackNumber: "",
  description: "",
};

const initialState: InventoryState = {
  productsWithInventories: [],
  loading: false,
  error: null,
  selectedProduct: null,
  // UI States
  searchQuery: "",
  isSearchingApi: false,
  apiSearchDone: false,
  showAddInventoryModal: false,
  showAddProductModal: false,
  showEditProductModal: false,
  editingInventory: null,
  // Form States
  newInventory: initialInventoryForm,
  newProduct: initialProductForm,
  editProduct: initialProductForm,
};

// Fetch all products with their inventories (single API call)
export const fetchProductsWithInventories = createAsyncThunk(
  "inventory/fetchProductsWithInventories",
  async (_, { rejectWithValue }) => {
    try {
      // Use chunkSize=1000 to get all products in one call
      // Cache for 30 seconds to avoid repeated fetches
      const response = await apiService.get(
        "/product",
        { chunkSize: 1000 },
        {
          cache: true,
          cacheTTL: 30000, // 30 second cache
          dedupe: true,
          timeout: 60000, // 60 second timeout for heavy product fetch
        }
      );

      // Backend returns { products: [...], pagination: {...} }
      // Each product has inventories array embedded
      if (response.products && Array.isArray(response.products)) {
        return response.products;
      }

      // Fallback for array response
      if (Array.isArray(response)) {
        return response;
      }

      return [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch products");
    }
  }
);

// Search for a product by productId from the API
export const searchProductByProductId = createAsyncThunk(
  "inventory/searchProductByProductId",
  async (productId: string, { rejectWithValue }) => {
    try {
      // Cancel previous search and use short cache for search results
      const response = await apiService.get(
        "/product",
        { search: productId },
        {
          cancelKey: "inventory-product-search",
          cache: true,
          cacheTTL: 10000, // 10 second cache for search
        }
      );

      // Backend returns { products: [...], pagination: {...} }
      if (response.products && Array.isArray(response.products)) {
        return response.products;
      }

      // Fallback for array response
      if (Array.isArray(response)) {
        return response;
      }

      return [];
    } catch (error: any) {
      // Don't treat cancellation as an error
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
        return [];
      }
      return rejectWithValue(error.message || "Failed to search product");
    }
  }
);

// Create new inventory and link to product
export const createInventoryForProduct = createAsyncThunk(
  "inventory/createInventoryForProduct",
  async (
    data: {
      productId: string; // MongoDB _id of the product
      cost: number;
      sellingPrice: number;
      stock: number;
    },
    { rejectWithValue }
  ) => {
    try {
      // First create the inventory
      const inventoryResponse = await apiService.post("/inventory", {
        cost: data.cost,
        sellingPrice: data.sellingPrice,
        stock: data.stock,
      });

      const inventoryId = inventoryResponse.data._id;

      // Then create the product-inventory relationship
      await apiService.post("/product-inventory", {
        productId: data.productId,
        inventoryId: inventoryId,
      });

      return {
        inventory: inventoryResponse.data,
        productId: data.productId,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create inventory");
    }
  }
);

// Update inventory
export const updateInventory = createAsyncThunk(
  "inventory/updateInventory",
  async (
    data: {
      inventoryId: string;
      cost: number;
      sellingPrice: number;
      stock: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.put(
        `/inventory?id=${data.inventoryId}`,
        {
          cost: data.cost,
          sellingPrice: data.sellingPrice,
          stock: data.stock,
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update inventory");
    }
  }
);

// Delete inventory (and its product-inventory relationship)
export const deleteInventory = createAsyncThunk(
  "inventory/deleteInventory",
  async (
    data: { inventoryId: string; linkId?: string },
    { rejectWithValue }
  ) => {
    try {
      // Delete the product-inventory relationship first if provided
      if (data.linkId) {
        await apiService.delete(`/product-inventory?id=${data.linkId}`);
      }

      // Then delete the inventory
      await apiService.delete(`/inventory?id=${data.inventoryId}`);

      return data.inventoryId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete inventory");
    }
  }
);

// Create new product
export const createProduct = createAsyncThunk(
  "inventory/createProduct",
  async (
    data: {
      productId: string;
      productName: string;
      brand?: string;
      category?: string;
      rackNumber?: string;
      description?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.post("/product", data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create product");
    }
  }
);

// Update product
export const updateProduct = createAsyncThunk(
  "inventory/updateProduct",
  async (
    data: {
      _id: string;
      productName?: string;
      brand?: string;
      category?: string;
      rackNumber?: string;
      description?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { _id, ...updateData } = data;
      const response = await apiService.put(`/product?id=${_id}`, updateData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update product");
    }
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setSelectedProduct: (
      state,
      action: PayloadAction<ProductWithInventories | null>
    ) => {
      state.selectedProduct = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // UI State actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setIsSearchingApi: (state, action: PayloadAction<boolean>) => {
      state.isSearchingApi = action.payload;
    },
    setApiSearchDone: (state, action: PayloadAction<boolean>) => {
      state.apiSearchDone = action.payload;
    },
    setShowAddInventoryModal: (state, action: PayloadAction<boolean>) => {
      state.showAddInventoryModal = action.payload;
      if (!action.payload) {
        // Reset form when closing modal
        state.newInventory = initialInventoryForm;
      }
    },
    setShowAddProductModal: (state, action: PayloadAction<boolean>) => {
      state.showAddProductModal = action.payload;
      if (!action.payload) {
        // Reset form when closing modal
        state.newProduct = initialProductForm;
      }
    },
    setShowEditProductModal: (state, action: PayloadAction<boolean>) => {
      state.showEditProductModal = action.payload;
    },
    setEditingInventory: (state, action: PayloadAction<Inventory | null>) => {
      state.editingInventory = action.payload;
      if (action.payload) {
        // Populate form with inventory data
        state.newInventory = {
          cost: action.payload.cost.toString(),
          sellingPrice: action.payload.sellingPrice.toString(),
          stock: action.payload.stock.toString(),
        };
      } else {
        // Reset form when clearing
        state.newInventory = initialInventoryForm;
      }
    },
    // Form State actions
    setNewInventory: (state, action: PayloadAction<NewInventoryForm>) => {
      state.newInventory = action.payload;
    },
    updateNewInventoryField: (
      state,
      action: PayloadAction<{ field: keyof NewInventoryForm; value: string }>
    ) => {
      state.newInventory[action.payload.field] = action.payload.value;
    },
    resetNewInventory: (state) => {
      state.newInventory = initialInventoryForm;
    },
    setNewProduct: (state, action: PayloadAction<NewProductForm>) => {
      state.newProduct = action.payload;
    },
    updateNewProductField: (
      state,
      action: PayloadAction<{ field: keyof NewProductForm; value: string }>
    ) => {
      state.newProduct[action.payload.field] = action.payload.value;
    },
    resetNewProduct: (state) => {
      state.newProduct = initialProductForm;
    },
    setEditProduct: (state, action: PayloadAction<NewProductForm>) => {
      state.editProduct = action.payload;
    },
    updateEditProductField: (
      state,
      action: PayloadAction<{ field: keyof NewProductForm; value: string }>
    ) => {
      state.editProduct[action.payload.field] = action.payload.value;
    },
    resetEditProduct: (state) => {
      state.editProduct = initialProductForm;
    },
    // Initialize edit product form from selected product
    initEditProductFromSelected: (state) => {
      if (state.selectedProduct) {
        state.editProduct = {
          productId: state.selectedProduct.productId,
          productName: state.selectedProduct.productName,
          brand: state.selectedProduct.brand || "",
          category: state.selectedProduct.category || "",
          rackNumber: state.selectedProduct.rackNumber || "",
          description: state.selectedProduct.description || "",
        };
      }
    },
    // Optimistic update for inventory
    optimisticUpdateInventory: (
      state,
      action: PayloadAction<{
        productId: string;
        inventoryId: string;
        cost: number;
        sellingPrice: number;
        stock: number;
      }>
    ) => {
      const { productId, inventoryId, cost, sellingPrice, stock } =
        action.payload;
      const product = state.productsWithInventories.find(
        (p) => p._id === productId
      );
      if (product) {
        const inventory = product.inventories.find(
          (inv) => inv._id === inventoryId
        );
        if (inventory) {
          inventory.cost = cost;
          inventory.sellingPrice = sellingPrice;
          inventory.stock = stock;
        }
      }
    },
    // Optimistic add inventory
    optimisticAddInventory: (
      state,
      action: PayloadAction<{
        productId: string;
        inventory: Inventory;
      }>
    ) => {
      const { productId, inventory } = action.payload;
      const product = state.productsWithInventories.find(
        (p) => p._id === productId
      );
      if (product) {
        product.inventories.push(inventory);
      }
    },
    // Replace temp inventory with real one from API response
    replaceTempInventory: (
      state,
      action: PayloadAction<{
        productId: string;
        tempId: string;
        realInventory: Inventory;
      }>
    ) => {
      const { productId, tempId, realInventory } = action.payload;
      const product = state.productsWithInventories.find(
        (p) => p._id === productId
      );
      if (product) {
        const index = product.inventories.findIndex(
          (inv) => inv._id === tempId
        );
        if (index !== -1) {
          product.inventories[index] = realInventory;
        }
      }
    },
    // Optimistic delete inventory
    optimisticDeleteInventory: (
      state,
      action: PayloadAction<{
        productId: string;
        inventoryId: string;
      }>
    ) => {
      const { productId, inventoryId } = action.payload;
      const product = state.productsWithInventories.find(
        (p) => p._id === productId
      );
      if (product) {
        product.inventories = product.inventories.filter(
          (inv) => inv._id !== inventoryId
        );
      }
    },
    // Revert optimistic update (restore previous state)
    revertInventoryState: (
      state,
      action: PayloadAction<ProductWithInventories[]>
    ) => {
      state.productsWithInventories = action.payload;
    },
    // Optimistic update for product
    optimisticUpdateProduct: (
      state,
      action: PayloadAction<{
        productId: string;
        productName?: string;
        brand?: string;
        category?: string;
        rackNumber?: string;
        description?: string;
      }>
    ) => {
      const {
        productId,
        productName,
        brand,
        category,
        rackNumber,
        description,
      } = action.payload;
      const product = state.productsWithInventories.find(
        (p) => p._id === productId
      );
      if (product) {
        if (productName !== undefined) product.productName = productName;
        if (brand !== undefined) product.brand = brand;
        if (category !== undefined) product.category = category;
        if (rackNumber !== undefined) product.rackNumber = rackNumber;
        if (description !== undefined) product.description = description;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products with Inventories
      .addCase(fetchProductsWithInventories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsWithInventories.fulfilled, (state, action) => {
        state.loading = false;
        state.productsWithInventories = action.payload;
      })
      .addCase(fetchProductsWithInventories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Search Product by ProductId
      .addCase(searchProductByProductId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProductByProductId.fulfilled, (state, action) => {
        state.loading = false;
        // Merge search results with existing products, avoiding duplicates
        const existingIds = new Set(
          state.productsWithInventories.map((p) => p._id)
        );
        const newProducts = action.payload.filter(
          (p: ProductWithInventories) => !existingIds.has(p._id)
        );
        if (newProducts.length > 0) {
          state.productsWithInventories = [
            ...state.productsWithInventories,
            ...newProducts,
          ];
        }
      })
      .addCase(searchProductByProductId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Inventory for Product
      .addCase(createInventoryForProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInventoryForProduct.fulfilled, (state) => {
        state.loading = false;
        // Data will be refreshed via fetchProductsWithInventories
      })
      .addCase(createInventoryForProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Inventory
      .addCase(updateInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInventory.fulfilled, (state) => {
        state.loading = false;
        // Data will be refreshed via fetchProductsWithInventories
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Inventory
      .addCase(deleteInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInventory.fulfilled, (state) => {
        state.loading = false;
        // Data will be refreshed via fetchProductsWithInventories
      })
      .addCase(deleteInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.loading = false;
        // Data will be refreshed via fetchProductsWithInventories
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state) => {
        state.loading = false;
        // Data will be refreshed via fetchProductsWithInventories
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedProduct,
  clearError,
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
  resetEditProduct,
  initEditProductFromSelected,
  optimisticUpdateInventory,
  optimisticAddInventory,
  optimisticDeleteInventory,
  replaceTempInventory,
  revertInventoryState,
  optimisticUpdateProduct,
} = inventorySlice.actions;

export default inventorySlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiService from "../services/api";
import { RootState } from "./store";

export interface Product {
  _id: string;
  productName: string;
  productId: string;
  description?: string;
  rackNumber?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  category?: string;
  brand?: string;
  supplier: string;
  updatedAt?: string;
  inventoryId?: string;
  supplierId?: string;
}

export interface FormData {
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

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  formData: FormData;
  lastFetched: number | null;
  hasMore: boolean;
  currentPage: number;
}

const initialFormData: FormData = {
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
};

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  searchQuery: "",
  formData: initialFormData,
  lastFetched: null,
  hasMore: true,
  currentPage: 1,
};

// Async Thunk for fetching products
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (
    {
      page = 1,
      search = "",
      supplier = "",
      reset = false,
      force = false,
    }: {
      page?: number;
      search?: string;
      supplier?: string;
      reset?: boolean;
      force?: boolean;
    },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as RootState;
    const { lastFetched, products, searchQuery } = state.products;
    const CHUNK_SIZE = 10;

    // Cache invalidation logic
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const isCacheValid =
      lastFetched && now - lastFetched < CACHE_DURATION && !force;
    const isSameSearch = search === searchQuery;

    // If cache is valid, not forcing refresh, same search, and not loading more (page 1), return existing
    if (
      isCacheValid &&
      isSameSearch &&
      page === 1 &&
      products.length > 0 &&
      !reset
    ) {
      return {
        products: products,
        hasMore: state.products.hasMore,
        page: 1,
        fromCache: true,
      };
    }

    try {
      const params: Record<string, any> = {
        search,
        chunkSize: CHUNK_SIZE,
        skip: (page - 1) * CHUNK_SIZE,
      };

      if (supplier) {
        params.supplier = supplier;
      }

      const response = await apiService.get("/product", params);

      let productsArray: any[] = [];
      let hasMoreData = false;

      // Handle different possible response structures
      if (response && response.products && Array.isArray(response.products)) {
        productsArray = response.products;
        hasMoreData =
          response.pagination?.hasMore ||
          response.products.length === CHUNK_SIZE;
      } else if (Array.isArray(response)) {
        productsArray = response;
        hasMoreData = response.length === CHUNK_SIZE;
      } else if (
        response &&
        response.data &&
        Array.isArray(response.data.products)
      ) {
        productsArray = response.data.products;
        hasMoreData =
          response.data.pagination?.hasMore ||
          response.data.products.length === CHUNK_SIZE;
      } else if (response && Array.isArray(response.data)) {
        productsArray = response.data;
        hasMoreData = response.data.length === CHUNK_SIZE;
      } else {
        throw new Error("Invalid data format received from server");
      }

      const mappedProducts = productsArray.map((item: any) => ({
        _id: item._id,
        productName: item.productName,
        productId: item.productId,
        description: item.description || "",
        rackNumber: item.rackNumber || "",
        costPrice:
          item.inventories?.[0]?.cost || item.cost || item.costPrice || 0,
        sellingPrice:
          item.inventories?.[0]?.sellingPrice || item.sellingPrice || 0,
        stock: item.inventories?.[0]?.stock || item.stock || 0,
        category: item.category || "",
        brand: item.brand || "",
        supplier:
          item.suppliers?.[0]?.supplierName ||
          item.supplier?.supplierName ||
          item.supplierName ||
          "",
        updatedAt: item.updatedAt || new Date().toISOString(),
        inventoryId: item.inventories?.[0]?._id || item.inventoryId || "",
        supplierId:
          item.suppliers?.[0]?._id ||
          item.supplier?._id ||
          item.supplierId ||
          "",
      }));

      return {
        products: mappedProducts,
        hasMore: hasMoreData,
        page,
        reset,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch products");
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
      state.lastFetched = null; // Invalidate cache
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(
        (p) => p._id === action.payload._id
      );
      if (index !== -1) {
        state.products[index] = action.payload;
      }
      state.lastFetched = null; // Invalidate cache
    },
    removeProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(
        (product) => product._id !== action.payload
      );
      state.lastFetched = null; // Invalidate cache
    },
    replaceProductById: (
      state,
      action: PayloadAction<{ oldId: string; newProduct: Product }>
    ) => {
      const index = state.products.findIndex(
        (p) => p._id === action.payload.oldId
      );
      if (index !== -1) {
        state.products[index] = action.payload.newProduct;
      }
      state.lastFetched = null; // Invalidate cache
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFormData: (state, action: PayloadAction<FormData>) => {
      state.formData = action.payload;
    },
    updateFormField: (
      state,
      action: PayloadAction<{ field: keyof FormData; value: string }>
    ) => {
      state.formData[action.payload.field] = action.payload.value;
    },
    resetFormData: (state) => {
      state.formData = initialFormData;
    },
    resetFormDataPreserveSupplierCategory: (state) => {
      const { supplier, category } = state.formData;
      state.formData = { ...initialFormData, supplier, category };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.fromCache) {
          return;
        }

        if (action.payload.reset) {
          state.products = action.payload.products;
        } else {
          // Filter out duplicates when appending
          const newProducts = action.payload.products.filter(
            (newP: Product) =>
              !state.products.some((existingP) => existingP._id === newP._id)
          );
          state.products = [...state.products, ...newProducts];
        }

        state.hasMore = action.payload.hasMore;
        state.currentPage = action.payload.page;
        state.lastFetched = Date.now();
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setProducts,
  addProduct,
  updateProduct,
  removeProduct,
  replaceProductById,
  setLoading,
  setError,
  setSearchQuery,
  setFormData,
  updateFormField,
  resetFormData,
  resetFormDataPreserveSupplierCategory,
} = productSlice.actions;

export default productSlice.reducer;

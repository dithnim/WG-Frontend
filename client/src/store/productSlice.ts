import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  searchQuery: "",
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(
        (p) => p._id === action.payload._id
      );
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    removeProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(
        (product) => product._id !== action.payload
      );
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
} = productSlice.actions;

export default productSlice.reducer;

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

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Supplier {
  _id: string;
  supplierName: string;
  description?: string;
  contact?: string;
  contactPerson?: string;
  createdAt?: string;
}

interface SupplierState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
}

const initialState: SupplierState = {
  suppliers: [],
  loading: false,
  error: null,
};

const supplierSlice = createSlice({
  name: "suppliers",
  initialState,
  reducers: {
    setSuppliers: (state, action: PayloadAction<Supplier[]>) => {
      state.suppliers = action.payload;
    },
    addSupplier: (state, action: PayloadAction<Supplier>) => {
      state.suppliers.push(action.payload);
    },
    updateSupplier: (state, action: PayloadAction<Supplier>) => {
      const index = state.suppliers.findIndex(
        (s) => s._id === action.payload._id
      );
      if (index !== -1) {
        state.suppliers[index] = action.payload;
      }
    },
    removeSupplier: (state, action: PayloadAction<string>) => {
      state.suppliers = state.suppliers.filter(
        (supplier) => supplier._id !== action.payload
      );
    },
    appendSuppliers: (state, action: PayloadAction<Supplier[]>) => {
      const existingIds = new Set(state.suppliers.map((s) => s._id));
      action.payload.forEach((supplier) => {
        if (!existingIds.has(supplier._id)) {
          state.suppliers.push(supplier);
        }
      });
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSuppliers,
  addSupplier,
  updateSupplier,
  removeSupplier,
  appendSuppliers,
  setLoading,
  setError,
} = supplierSlice.actions;
export default supplierSlice.reducer;

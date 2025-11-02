import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Supplier {
  _id: string;
  supplierName: string;
  description?: string;
  contact?: string;
  contactPerson?: string;
  createdAt?: string;
}

export interface FormData {
  supplierName: string;
  description?: string;
  contact?: string;
  contactPerson?: string;
}

interface SupplierState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  formData: FormData;
}

const initialFormData: FormData = {
  supplierName: "",
  description: "",
  contact: "",
  contactPerson: "",
};

const initialState: SupplierState = {
  suppliers: [],
  loading: false,
  error: null,
  formData: initialFormData,
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
  setFormData,
  updateFormField,
  resetFormData,
} = supplierSlice.actions;
export default supplierSlice.reducer;

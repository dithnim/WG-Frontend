import { configureStore } from "@reduxjs/toolkit";
import supplierReducer from "./supplierSlice";
import productReducer from "./productSlice";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    suppliers: supplierReducer,
    products: productReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

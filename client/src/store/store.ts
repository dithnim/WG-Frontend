import { configureStore } from "@reduxjs/toolkit";
import supplierReducer from "./supplierSlice";
import productReducer from "./productSlice";
import authReducer from "./authSlice";
import dashboardReducer from "./dashboardSlice";
import inventoryReducer from "./inventorySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    suppliers: supplierReducer,
    products: productReducer,
    dashboard: dashboardReducer,
    inventory: inventoryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

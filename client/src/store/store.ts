import { configureStore } from "@reduxjs/toolkit";
import supplierReducer from "./supplierSlice";

export const store = configureStore({
  reducer: {
    suppliers: supplierReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

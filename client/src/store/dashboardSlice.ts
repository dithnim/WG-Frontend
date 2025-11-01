import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiService from "../services/api";

// Types
export interface CountListItem {
  count: number;
  date: string;
  updatedAt: string;
}

interface DashboardCounts {
  current: number;
  previous: number;
  percentage: string;
  countList: CountListItem[];
}

interface DashboardState {
  suppliers: DashboardCounts;
  products: DashboardCounts;
  sales: DashboardCounts;
  revenue: DashboardCounts;
  timeframe: string;
  loading: boolean;
  error: string | null;
}

const initialCounts: DashboardCounts = {
  current: 0,
  previous: 0,
  percentage: "0.00",
  countList: [],
};

const initialState: DashboardState = {
  suppliers: initialCounts,
  products: initialCounts,
  sales: initialCounts,
  revenue: initialCounts,
  timeframe: "month",
  loading: false,
  error: null,
};

// Async thunks
export const fetchSupplierCount = createAsyncThunk(
  "dashboard/fetchSupplierCount",
  async (timeframe: string, { rejectWithValue }) => {
    try {
      const data = await apiService.get(`/suppliers/count`, {
        search: timeframe,
      });

      const today = new Date().toISOString().split("T")[0];
      const newCount: CountListItem = {
        count: data.totalCount || 0,
        date: today,
        updatedAt: new Date().toISOString(),
      };

      return {
        current: data.totalCount || 0,
        newCount,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch supplier count");
    }
  }
);

export const fetchProductCount = createAsyncThunk(
  "dashboard/fetchProductCount",
  async (timeframe: string, { rejectWithValue }) => {
    try {
      const data = await apiService.get(`/products/count`, {
        search: timeframe,
      });

      const today = new Date().toISOString().split("T")[0];
      const newCount: CountListItem = {
        count: data.totalCount || 0,
        date: today,
        updatedAt: new Date().toISOString(),
      };

      return {
        current: data.totalCount || 0,
        newCount,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product count");
    }
  }
);

export const fetchSaleCount = createAsyncThunk(
  "dashboard/fetchSaleCount",
  async (timeframe: string, { rejectWithValue }) => {
    try {
      const data = await apiService.get(`/sales/count`, {
        search: timeframe,
      });

      return {
        current: data.count || 0,
        previous: data.prevCount || 0,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sale count");
    }
  }
);

export const fetchRevenueCount = createAsyncThunk(
  "dashboard/fetchRevenueCount",
  async (timeframe: string, { rejectWithValue }) => {
    try {
      const data = await apiService.get(`/sales/revenue`, {
        search: timeframe,
      });

      return {
        current: data.totalRevenue || 0,
        previous: data.prevTotalRevenue || 0,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch revenue");
    }
  }
);

// Fetch all dashboard data
export const fetchAllDashboardData = createAsyncThunk(
  "dashboard/fetchAllData",
  async (timeframe: string, { dispatch }) => {
    await Promise.all([
      dispatch(fetchSupplierCount(timeframe)),
      dispatch(fetchProductCount(timeframe)),
      dispatch(fetchSaleCount(timeframe)),
      dispatch(fetchRevenueCount(timeframe)),
    ]);
  }
);

// Helper function to calculate percentage
const calculatePercentage = (current: number, previous: number): string => {
  if (current === 0 && previous === 0) return "0.00";
  if (previous === 0) return "100.00";
  const percentage = ((current - previous) / previous) * 100;
  return isNaN(percentage) ? "0.00" : percentage.toFixed(2);
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setTimeframe: (state, action: PayloadAction<string>) => {
      state.timeframe = action.payload;
    },
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Supplier Count
    builder
      .addCase(fetchSupplierCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupplierCount.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers.current = action.payload.current;

        // Update count list
        const updatedList = [...state.suppliers.countList];
        const existingIndex = updatedList.findIndex(
          (item) => item.date === action.payload.newCount.date
        );

        if (existingIndex !== -1) {
          updatedList[existingIndex] = action.payload.newCount;
        } else {
          updatedList.push(action.payload.newCount);
        }

        // Keep only last 30 days
        state.suppliers.countList = updatedList.slice(-30);

        // Calculate previous count and percentage
        state.suppliers.previous =
          state.suppliers.countList.length > 0
            ? state.suppliers.countList[0].count
            : 0;
        state.suppliers.percentage = calculatePercentage(
          state.suppliers.current,
          state.suppliers.previous
        );
      })
      .addCase(fetchSupplierCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.suppliers.current = 0;
        state.suppliers.previous = 0;
      });

    // Product Count
    builder
      .addCase(fetchProductCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductCount.fulfilled, (state, action) => {
        state.loading = false;
        state.products.current = action.payload.current;

        // Update count list
        const updatedList = [...state.products.countList];
        const existingIndex = updatedList.findIndex(
          (item) => item.date === action.payload.newCount.date
        );

        if (existingIndex !== -1) {
          updatedList[existingIndex] = action.payload.newCount;
        } else {
          updatedList.push(action.payload.newCount);
        }

        // Keep only last 30 days
        state.products.countList = updatedList.slice(-30);

        // Calculate previous count and percentage
        state.products.previous =
          state.products.countList.length > 0
            ? state.products.countList[0].count
            : 0;
        state.products.percentage = calculatePercentage(
          state.products.current,
          state.products.previous
        );
      })
      .addCase(fetchProductCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.products.current = 0;
        state.products.previous = 0;
      });

    // Sale Count
    builder
      .addCase(fetchSaleCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleCount.fulfilled, (state, action) => {
        state.loading = false;
        state.sales.current = action.payload.current;
        state.sales.previous = action.payload.previous;
        state.sales.percentage = calculatePercentage(
          action.payload.current,
          action.payload.previous
        );
      })
      .addCase(fetchSaleCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Revenue Count
    builder
      .addCase(fetchRevenueCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenueCount.fulfilled, (state, action) => {
        state.loading = false;
        state.revenue.current = action.payload.current;
        state.revenue.previous = action.payload.previous;
        state.revenue.percentage = calculatePercentage(
          action.payload.current,
          action.payload.previous
        );
      })
      .addCase(fetchRevenueCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch All Data
    builder
      .addCase(fetchAllDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllDashboardData.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchAllDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch dashboard data";
      });
  },
});

export const { setTimeframe, clearDashboardError } = dashboardSlice.actions;

export default dashboardSlice.reducer;

// Selectors
export const selectDashboardLoading = (state: { dashboard: DashboardState }) =>
  state.dashboard.loading;
export const selectDashboardError = (state: { dashboard: DashboardState }) =>
  state.dashboard.error;
export const selectTimeframe = (state: { dashboard: DashboardState }) =>
  state.dashboard.timeframe;
export const selectSuppliers = (state: { dashboard: DashboardState }) =>
  state.dashboard.suppliers;
export const selectProducts = (state: { dashboard: DashboardState }) =>
  state.dashboard.products;
export const selectSales = (state: { dashboard: DashboardState }) =>
  state.dashboard.sales;
export const selectRevenue = (state: { dashboard: DashboardState }) =>
  state.dashboard.revenue;

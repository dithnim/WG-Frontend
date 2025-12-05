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

interface TopSellingProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface PaymentMethodBreakdown {
  method: string;
  count: number;
  total: number;
}

interface StorePerformance {
  totalProfit: number;
  profitMargin: number;
  averageOrderValue: number;
  topSellingProducts: TopSellingProduct[];
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  profit30Days: number[];
}

interface DashboardState {
  products: DashboardCounts;
  sales: DashboardCounts;
  product30DayData: {
    counts: number[];
    currentCount: number;
  };
  supplier30DayData: {
    counts: number[];
    currentCount: number;
  };
  salesRevenue30DayData: {
    revenues: number[];
    currentRevenue: number;
  };
  salesCount30DayData: {
    counts: number[];
    currentCount: number;
  };
  storePerformance: StorePerformance;
  timeframe: string;
  loading: boolean;
  loadingProduct30Day: boolean;
  loadingSupplier30Day: boolean;
  loadingSalesRevenue30Day: boolean;
  loadingSalesCount30Day: boolean;
  loadingStorePerformance: boolean;
  loadingProductCount: boolean;
  loadingSaleCount: boolean;
  error: string | null;
  lastFetchedProduct30Day: number | null;
  lastFetchedSupplier30Day: number | null;
  lastFetchedSalesRevenue30Day: number | null;
  lastFetchedSalesCount30Day: number | null;
  lastFetchedStorePerformance: number | null;
  lastFetchedProductCount: number | null;
  lastFetchedSaleCount: number | null;
}

const initialCounts: DashboardCounts = {
  current: 0,
  previous: 0,
  percentage: "0.00",
  countList: [],
};

const initialStorePerformance: StorePerformance = {
  totalProfit: 0,
  profitMargin: 0,
  averageOrderValue: 0,
  topSellingProducts: [],
  paymentMethodBreakdown: [],
  profit30Days: [],
};

const initialState: DashboardState = {
  products: initialCounts,
  sales: initialCounts,
  product30DayData: {
    counts: [],
    currentCount: 0,
  },
  supplier30DayData: {
    counts: [],
    currentCount: 0,
  },
  salesRevenue30DayData: {
    revenues: [],
    currentRevenue: 0,
  },
  salesCount30DayData: {
    counts: [],
    currentCount: 0,
  },
  storePerformance: initialStorePerformance,
  timeframe: "month",
  loading: false,
  loadingProduct30Day: false,
  loadingSupplier30Day: false,
  loadingSalesRevenue30Day: false,
  loadingSalesCount30Day: false,
  loadingStorePerformance: false,
  loadingProductCount: false,
  loadingSaleCount: false,
  error: null,
  lastFetchedProduct30Day: null,
  lastFetchedSupplier30Day: null,
  lastFetchedSalesRevenue30Day: null,
  lastFetchedSalesCount30Day: null,
  lastFetchedStorePerformance: null,
  lastFetchedProductCount: null,
  lastFetchedSaleCount: null,
};

// Async thunks
export const fetchProduct30DayData = createAsyncThunk(
  "dashboard/fetchProduct30DayData",
  async (_, { rejectWithValue }) => {
    try {
      // Use API-level caching with 5 minute TTL
      const data = await apiService.get(
        "/products/count/30days",
        {},
        {
          cache: true,
          cacheTTL: 5 * 60 * 1000, // 5 minutes
          dedupe: true,
        }
      );
      return {
        counts: Array.isArray(data.counts) ? data.counts : [],
        currentCount: data.currentCount || 0,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch 30-day product data"
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { dashboard: DashboardState };
      const { lastFetchedProduct30Day } = state.dashboard;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      if (
        lastFetchedProduct30Day &&
        Date.now() - lastFetchedProduct30Day < CACHE_DURATION
      ) {
        return false;
      }
      return true;
    },
  }
);

export const fetchSupplier30DayData = createAsyncThunk(
  "dashboard/fetchSupplier30DayData",
  async (_, { rejectWithValue }) => {
    try {
      // Use API-level caching with 5 minute TTL
      const data = await apiService.get(
        "/supplier/count/30days",
        {},
        {
          cache: true,
          cacheTTL: 5 * 60 * 1000, // 5 minutes
          dedupe: true,
        }
      );
      return {
        counts: Array.isArray(data.counts) ? data.counts : [],
        currentCount: data.currentCount || 0,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch 30-day supplier data"
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { dashboard: DashboardState };
      const { lastFetchedSupplier30Day } = state.dashboard;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      if (
        lastFetchedSupplier30Day &&
        Date.now() - lastFetchedSupplier30Day < CACHE_DURATION
      ) {
        return false;
      }
      return true;
    },
  }
);

// Fetch 30-day sales revenue data
export const fetchSalesRevenue30DayData = createAsyncThunk(
  "dashboard/fetchSalesRevenue30DayData",
  async (_, { rejectWithValue }) => {
    try {
      // Use API-level caching with 5 minute TTL
      const data = await apiService.get(
        "/sales/revenue/30days",
        {},
        {
          cache: true,
          cacheTTL: 5 * 60 * 1000, // 5 minutes
          dedupe: true,
        }
      );
      return {
        revenues: Array.isArray(data.revenues) ? data.revenues : [],
        currentRevenue: data.currentRevenue || 0,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch 30-day sales revenue data"
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { dashboard: DashboardState };
      const { lastFetchedSalesRevenue30Day } = state.dashboard;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      if (
        lastFetchedSalesRevenue30Day &&
        Date.now() - lastFetchedSalesRevenue30Day < CACHE_DURATION
      ) {
        return false;
      }
      return true;
    },
  }
);

// Fetch 30-day sales count data
export const fetchSalesCount30DayData = createAsyncThunk(
  "dashboard/fetchSalesCount30DayData",
  async (_, { rejectWithValue }) => {
    try {
      // Use API-level caching with 5 minute TTL
      const data = await apiService.get(
        "/sales/count/30days",
        {},
        {
          cache: true,
          cacheTTL: 5 * 60 * 1000, // 5 minutes
          dedupe: true,
        }
      );
      return {
        counts: Array.isArray(data.counts) ? data.counts : [],
        currentCount: data.currentCount || 0,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch 30-day sales count data"
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { dashboard: DashboardState };
      const { lastFetchedSalesCount30Day } = state.dashboard;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      if (
        lastFetchedSalesCount30Day &&
        Date.now() - lastFetchedSalesCount30Day < CACHE_DURATION
      ) {
        return false;
      }
      return true;
    },
  }
);

// Fetch store performance metrics
export const fetchStorePerformance = createAsyncThunk(
  "dashboard/fetchStorePerformance",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiService.get(
        "/sales/performance",
        {},
        {
          cache: true,
          cacheTTL: 5 * 60 * 1000, // 5 minutes
          dedupe: true,
        }
      );
      return {
        totalProfit: data.totalProfit || 0,
        profitMargin: data.profitMargin || 0,
        averageOrderValue: data.averageOrderValue || 0,
        topSellingProducts: Array.isArray(data.topSellingProducts)
          ? data.topSellingProducts
          : [],
        paymentMethodBreakdown: Array.isArray(data.paymentMethodBreakdown)
          ? data.paymentMethodBreakdown
          : [],
        profit30Days: Array.isArray(data.profit30Days) ? data.profit30Days : [],
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch store performance metrics"
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { dashboard: DashboardState };
      const { lastFetchedStorePerformance } = state.dashboard;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      if (
        lastFetchedStorePerformance &&
        Date.now() - lastFetchedStorePerformance < CACHE_DURATION
      ) {
        return false;
      }
      return true;
    },
  }
);

export const fetchProductCount = createAsyncThunk(
  "dashboard/fetchProductCount",
  async (timeframe: string, { rejectWithValue }) => {
    try {
      // Use API-level caching with 5 minute TTL
      const data = await apiService.get(
        `/products/count`,
        {
          search: timeframe,
        },
        {
          cache: true,
          cacheTTL: 5 * 60 * 1000, // 5 minutes
          dedupe: true,
        }
      );

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
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { dashboard: DashboardState };
      const { lastFetchedProductCount } = state.dashboard;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      if (
        lastFetchedProductCount &&
        Date.now() - lastFetchedProductCount < CACHE_DURATION
      ) {
        return false;
      }
      return true;
    },
  }
);

export const fetchSaleCount = createAsyncThunk(
  "dashboard/fetchSaleCount",
  async (timeframe: string, { rejectWithValue }) => {
    try {
      // Use API-level caching with 5 minute TTL
      const data = await apiService.get(
        `/sales/count`,
        {
          search: timeframe,
        },
        {
          cache: true,
          cacheTTL: 5 * 60 * 1000, // 5 minutes
          dedupe: true,
        }
      );

      return {
        current: data.count || 0,
        previous: data.prevCount || 0,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sale count");
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { dashboard: DashboardState };
      const { lastFetchedSaleCount } = state.dashboard;
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      if (
        lastFetchedSaleCount &&
        Date.now() - lastFetchedSaleCount < CACHE_DURATION
      ) {
        return false;
      }
      return true;
    },
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
    // Product 30-day data
    builder
      .addCase(fetchProduct30DayData.pending, (state) => {
        state.loadingProduct30Day = true;
        state.error = null;
      })
      .addCase(fetchProduct30DayData.fulfilled, (state, action) => {
        state.loadingProduct30Day = false;
        state.product30DayData = action.payload;
        state.lastFetchedProduct30Day = Date.now();
      })
      .addCase(fetchProduct30DayData.rejected, (state, action) => {
        state.loadingProduct30Day = false;
        state.error = action.payload as string;
        state.product30DayData = {
          counts: [],
          currentCount: 0,
        };
      });

    // Supplier 30-day data
    builder
      .addCase(fetchSupplier30DayData.pending, (state) => {
        state.loadingSupplier30Day = true;
        state.error = null;
      })
      .addCase(fetchSupplier30DayData.fulfilled, (state, action) => {
        state.loadingSupplier30Day = false;
        state.supplier30DayData = action.payload;
        state.lastFetchedSupplier30Day = Date.now();
      })
      .addCase(fetchSupplier30DayData.rejected, (state, action) => {
        state.loadingSupplier30Day = false;
        state.error = action.payload as string;
        state.supplier30DayData = {
          counts: [],
          currentCount: 0,
        };
      });

    // Sales Revenue 30-day data
    builder
      .addCase(fetchSalesRevenue30DayData.pending, (state) => {
        state.loadingSalesRevenue30Day = true;
        state.error = null;
      })
      .addCase(fetchSalesRevenue30DayData.fulfilled, (state, action) => {
        state.loadingSalesRevenue30Day = false;
        state.salesRevenue30DayData = action.payload;
        state.lastFetchedSalesRevenue30Day = Date.now();
      })
      .addCase(fetchSalesRevenue30DayData.rejected, (state, action) => {
        state.loadingSalesRevenue30Day = false;
        state.error = action.payload as string;
        state.salesRevenue30DayData = {
          revenues: [],
          currentRevenue: 0,
        };
      });

    // Sales Count 30-day data
    builder
      .addCase(fetchSalesCount30DayData.pending, (state) => {
        state.loadingSalesCount30Day = true;
        state.error = null;
      })
      .addCase(fetchSalesCount30DayData.fulfilled, (state, action) => {
        state.loadingSalesCount30Day = false;
        state.salesCount30DayData = action.payload;
        state.lastFetchedSalesCount30Day = Date.now();
      })
      .addCase(fetchSalesCount30DayData.rejected, (state, action) => {
        state.loadingSalesCount30Day = false;
        state.error = action.payload as string;
        state.salesCount30DayData = {
          counts: [],
          currentCount: 0,
        };
      });

    // Store Performance
    builder
      .addCase(fetchStorePerformance.pending, (state) => {
        state.loadingStorePerformance = true;
        state.error = null;
      })
      .addCase(fetchStorePerformance.fulfilled, (state, action) => {
        state.loadingStorePerformance = false;
        state.storePerformance = action.payload;
        state.lastFetchedStorePerformance = Date.now();
      })
      .addCase(fetchStorePerformance.rejected, (state, action) => {
        state.loadingStorePerformance = false;
        state.error = action.payload as string;
        state.storePerformance = {
          totalProfit: 0,
          profitMargin: 0,
          averageOrderValue: 0,
          topSellingProducts: [],
          paymentMethodBreakdown: [],
          profit30Days: [],
        };
      });

    // Product Count
    builder
      .addCase(fetchProductCount.pending, (state) => {
        state.loadingProductCount = true;
        state.error = null;
      })
      .addCase(fetchProductCount.fulfilled, (state, action) => {
        state.loadingProductCount = false;
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
        state.lastFetchedProductCount = Date.now();
      })
      .addCase(fetchProductCount.rejected, (state, action) => {
        state.loadingProductCount = false;
        state.error = action.payload as string;
        state.products.current = 0;
        state.products.previous = 0;
      });

    // Sale Count
    builder
      .addCase(fetchSaleCount.pending, (state) => {
        state.loadingSaleCount = true;
        state.error = null;
      })
      .addCase(fetchSaleCount.fulfilled, (state, action) => {
        state.loadingSaleCount = false;
        state.sales.current = action.payload.current;
        state.sales.previous = action.payload.previous;
        state.sales.percentage = calculatePercentage(
          action.payload.current,
          action.payload.previous
        );
        state.lastFetchedSaleCount = Date.now();
      })
      .addCase(fetchSaleCount.rejected, (state, action) => {
        state.loadingSaleCount = false;
        state.error = action.payload as string;
      });
  },
});

export const { setTimeframe, clearDashboardError } = dashboardSlice.actions;

export default dashboardSlice.reducer;

// Selectors
export const selectDashboardLoading = (state: { dashboard: DashboardState }) =>
  state.dashboard.loadingProduct30Day ||
  state.dashboard.loadingSupplier30Day ||
  state.dashboard.loadingSalesRevenue30Day ||
  state.dashboard.loadingSalesCount30Day ||
  state.dashboard.loadingStorePerformance ||
  state.dashboard.loadingProductCount ||
  state.dashboard.loadingSaleCount;
export const selectLoadingProduct30Day = (state: {
  dashboard: DashboardState;
}) => state.dashboard.loadingProduct30Day;
export const selectLoadingSupplier30Day = (state: {
  dashboard: DashboardState;
}) => state.dashboard.loadingSupplier30Day;
export const selectLoadingSalesRevenue30Day = (state: {
  dashboard: DashboardState;
}) => state.dashboard.loadingSalesRevenue30Day;
export const selectLoadingSalesCount30Day = (state: {
  dashboard: DashboardState;
}) => state.dashboard.loadingSalesCount30Day;
export const selectLoadingStorePerformance = (state: {
  dashboard: DashboardState;
}) => state.dashboard.loadingStorePerformance;
export const selectDashboardError = (state: { dashboard: DashboardState }) =>
  state.dashboard.error;
export const selectTimeframe = (state: { dashboard: DashboardState }) =>
  state.dashboard.timeframe;
export const selectProducts = (state: { dashboard: DashboardState }) =>
  state.dashboard.products;
export const selectSales = (state: { dashboard: DashboardState }) =>
  state.dashboard.sales;
export const selectProduct30DayData = (state: { dashboard: DashboardState }) =>
  state.dashboard.product30DayData;
export const selectSupplier30DayData = (state: { dashboard: DashboardState }) =>
  state.dashboard.supplier30DayData;
export const selectSalesRevenue30DayData = (state: {
  dashboard: DashboardState;
}) => state.dashboard.salesRevenue30DayData;
export const selectSalesCount30DayData = (state: {
  dashboard: DashboardState;
}) => state.dashboard.salesCount30DayData;
export const selectStorePerformance = (state: { dashboard: DashboardState }) =>
  state.dashboard.storePerformance;

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiService from "../services/api";
import { User, AuthState, LogoutReason } from "../types/auth.types";

export type { User };

const initialState: AuthState = {
  user: (() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  })(),
  isAuthenticated: (() => {
    const savedUser = localStorage.getItem("user");
    const token = sessionStorage.getItem("token");
    return !!(savedUser && token);
  })(),
  loading: false,
  error: null,
  notificationMessage: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/login",
  async (userData: any, { rejectWithValue }) => {
    try {
      // Extract user data from different response structures
      const userWithRole: User = {
        username:
          userData?.username ||
          userData?.userData?.username ||
          userData?.user?.username,
        email:
          userData?.email || userData?.userData?.email || userData?.user?.email,
        role:
          userData?.role ||
          userData?.userData?.role ||
          userData?.user?.role ||
          "user",
        name:
          userData?.name || userData?.userData?.name || userData?.user?.name,
        imageUrl:
          userData?.imageUrl ||
          userData?.userData?.imageUrl ||
          userData?.user?.imageUrl ||
          "",
        ...userData?.userData,
      };

      // Store user data
      localStorage.setItem("user", JSON.stringify(userWithRole));

      return userWithRole;
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (reason: LogoutReason = "USER_LOGOUT", { rejectWithValue }) => {
    try {
      // Call backend logout endpoint (only if user manually logs out)
      if (reason === "USER_LOGOUT") {
        try {
          await apiService.post("/logout", {});
        } catch (error) {
          console.error("Logout API error:", error);
          // Continue with local logout even if API call fails
        }
      }

      // Clear all auth data
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenExpiration");

      return { reason };
    } catch (error: any) {
      return rejectWithValue(error.message || "Logout failed");
    }
  }
);

export const validateToken = createAsyncThunk(
  "auth/validateToken",
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        return false;
      }

      const tokenExpiration = localStorage.getItem("tokenExpiration");
      if (tokenExpiration && new Date().getTime() > parseInt(tokenExpiration)) {
        return false;
      }

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || "Token validation failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("user");
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.notificationMessage = null;
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenExpiration");
    },
    setNotificationMessage: (state, action: PayloadAction<string | null>) => {
      state.notificationMessage = action.payload;
    },
    clearNotificationMessage: (state) => {
      state.notificationMessage = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;

        // Set notification message for specific logout reasons
        if (action.payload.reason === "REFRESH_TOKEN_INVALID") {
          state.notificationMessage =
            "Your session has expired. Please log in again.";
        }
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Still clear auth data on error
        state.user = null;
        state.isAuthenticated = false;
      });

    // Validate token
    builder
      .addCase(validateToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload) {
          // Token is invalid, clear auth
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(validateToken.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const {
  setUser,
  clearAuth,
  setNotificationMessage,
  clearNotificationMessage,
  setError,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectNotificationMessage = (state: { auth: AuthState }) =>
  state.auth.notificationMessage;

// Helper functions for role-based access
export const hasRole = (user: User | null, requiredRole: string): boolean => {
  if (!user) return false;
  return user.role === requiredRole;
};

export const hasAnyRole = (user: User | null, roles: string[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

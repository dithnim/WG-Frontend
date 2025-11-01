import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiService from "../services/api";
import { User, AuthState, LogoutReason } from "../types/auth.types";

export type { User };

const initialState: AuthState = {
  user: (() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  })(),
  token: (() => {
    return sessionStorage.getItem("token");
  })(),
  refreshToken: (() => {
    return localStorage.getItem("refreshToken");
  })(),
  tokenExpiration: (() => {
    const expiration = localStorage.getItem("tokenExpiration");
    return expiration ? parseInt(expiration) : null;
  })(),
  isAuthenticated: (() => {
    const token = sessionStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    return !!(token && savedUser);
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

      // Calculate token expiration
      const expiresIn = userData.expiresIn || 900; // 15 minutes default
      const expirationTime = new Date().getTime() + expiresIn * 1000;

      // Store in sessionStorage/localStorage
      sessionStorage.setItem("token", userData.token);
      localStorage.setItem("user", JSON.stringify(userWithRole));
      localStorage.setItem("tokenExpiration", expirationTime.toString());
      if (userData.refreshToken) {
        localStorage.setItem("refreshToken", userData.refreshToken);
      }

      return {
        user: userWithRole,
        token: userData.token,
        refreshToken: userData.refreshToken || null,
        tokenExpiration: expirationTime,
      };
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

      // Clear sessionStorage/localStorage
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
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
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const { token, tokenExpiration } = state.auth;

      if (!token) {
        return false;
      }

      if (tokenExpiration && new Date().getTime() > tokenExpiration) {
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
    setToken: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string;
        expiresIn?: number;
      }>
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      const expiresIn = action.payload.expiresIn || 900;
      const expirationTime = new Date().getTime() + expiresIn * 1000;
      state.tokenExpiration = expirationTime;

      // Store in sessionStorage/localStorage
      sessionStorage.setItem("token", action.payload.token);
      localStorage.setItem("tokenExpiration", expirationTime.toString());
      if (action.payload.refreshToken) {
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tokenExpiration = null;
      state.isAuthenticated = false;
      state.error = null;
      state.notificationMessage = null;

      // Clear storage
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
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
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.tokenExpiration = action.payload.tokenExpiration;
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
        state.token = null;
        state.refreshToken = null;
        state.tokenExpiration = null;
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
        state.token = null;
        state.refreshToken = null;
        state.tokenExpiration = null;
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
          state.token = null;
          state.refreshToken = null;
          state.tokenExpiration = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(validateToken.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.tokenExpiration = null;
        state.isAuthenticated = false;
      });
  },
});

export const {
  setUser,
  setToken,
  clearAuth,
  setNotificationMessage,
  clearNotificationMessage,
  setError,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectRefreshToken = (state: { auth: AuthState }) =>
  state.auth.refreshToken;
export const selectTokenExpiration = (state: { auth: AuthState }) =>
  state.auth.tokenExpiration;
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

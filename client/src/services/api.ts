import axios from "axios";
import type { RootState } from "../store/store";

// Token validation callback - will be set by the app
let tokenInvalidCallback: ((reason: string) => void) | null = null;

// Redux store reference - will be set by the app
let reduxStore: {
  getState: () => RootState;
  dispatch: (action: any) => void;
} | null = null;

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Register callback for token validation issues
export const registerTokenInvalidCallback = (
  callback: (reason: string) => void
) => {
  tokenInvalidCallback = callback;
};

// Register Redux store for accessing auth state
export const registerReduxStore = (store: {
  getState: () => RootState;
  dispatch: (action: any) => void;
}) => {
  reduxStore = store;
};

// Add subscribers to retry requests after token refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Notify all subscribers with new token
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Attempt to refresh the access token
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = reduxStore
      ? reduxStore.getState().auth.refreshToken
      : localStorage.getItem("refreshToken");

    if (!refreshToken) {
      return null;
    }
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/refresh-token`,
      { refreshToken },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.data && response.data.token) {
      const newToken = response.data.token;

      // Update storage
      sessionStorage.setItem("token", newToken);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

      // Update Redux store if available
      if (reduxStore) {
        const { setToken } = await import("../store/authSlice");
        reduxStore.dispatch(
          setToken({
            token: newToken,
            refreshToken: response.data.refreshToken,
            expiresIn: response.data.expiresIn,
          })
        );
      }

      return newToken;
    }
    return null;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000, // Increased to 30 seconds to prevent premature cancellation
  headers: {
    "Content-Type": "application/json",
  },
  // Enable credentials for CORS
  withCredentials: false,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // List of endpoints that don't require authentication
    const publicEndpoints = [
      "/login",
      "/request-otp",
      "/verify-otp",
      "/reset-password",
      "/refresh-token",
      "/validate-token",
    ];

    // Check if the current endpoint is public (doesn't require auth)
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    // If it's a public endpoint, skip token validation
    if (isPublicEndpoint) {
      return config;
    }

    // Get token from Redux store or sessionStorage as fallback
    const token = reduxStore
      ? reduxStore.getState().auth.token
      : sessionStorage.getItem("token");

    // Check if token exists
    if (!token) {
      // Token not available - silently logout
      if (tokenInvalidCallback) {
        tokenInvalidCallback("TOKEN_NOT_FOUND");
      }
      // Cancel the request and redirect will be handled by callback
      return Promise.reject({
        message: "Authentication required",
        reason: "TOKEN_NOT_FOUND",
        silent: true,
      });
    }

    // If token exists, add it to headers
    config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle request cancellation (CORS/preflight issues)
    if (error.code === "ERR_CANCELED" || error.message === "canceled") {
      console.error("Request was canceled - likely CORS or preflight issue");
      return Promise.reject({
        ...error,
        message:
          "Request canceled. This may be a CORS issue. Please check API Gateway CORS settings.",
        reason: "REQUEST_CANCELED",
      });
    }

    // Handle network timeout
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
      return Promise.reject({
        ...error,
        message: "Request timeout. The server took too long to respond.",
        reason: "TIMEOUT",
      });
    }

    // Handle common errors here
    if (error.response) {
      const status = error.response.status;

      // Handle 401 Unauthorized - Try to refresh token
      if (status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, wait for the new token
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();

          if (newToken) {
            // Token refresh successful
            isRefreshing = false;
            onRefreshed(newToken);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } else {
            // Token refresh failed - logout user
            isRefreshing = false;

            // Clear Redux auth state
            if (reduxStore) {
              const { clearAuth } = await import("../store/authSlice");
              reduxStore.dispatch(clearAuth());
            }

            // Notify about token invalidity
            if (tokenInvalidCallback) {
              tokenInvalidCallback("TOKEN_INVALID");
            }

            // Redirect to login page
            window.location.href = "/login";

            return Promise.reject({
              ...error,
              message: "Session expired. Please log in again.",
              reason: "TOKEN_INVALID",
            });
          }
        } catch (refreshError) {
          // Token refresh failed - logout user
          isRefreshing = false;

          // Clear Redux auth state
          if (reduxStore) {
            const { clearAuth } = await import("../store/authSlice");
            reduxStore.dispatch(clearAuth());
          }

          // Notify about token invalidity
          if (tokenInvalidCallback) {
            tokenInvalidCallback("REFRESH_TOKEN_INVALID");
          }

          // Redirect to login page
          window.location.href = "/login";

          return Promise.reject({
            ...error,
            message: "Session expired. Please log in again.",
            reason: "REFRESH_TOKEN_INVALID",
          });
        }
      }

      // Handle 403 Forbidden - Access denied
      if (status === 403) {
        console.error("Access denied");
        return Promise.reject({
          ...error,
          message:
            "Access denied. You don't have permission to perform this action.",
          reason: "ACCESS_DENIED",
        });
      }

      console.error("Response Error:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Request Error:", error.request);
      return Promise.reject({
        ...error,
        message: "Network error. Please check your internet connection.",
        reason: "NETWORK_ERROR",
      });
    } else if (error.reason === "TOKEN_NOT_FOUND") {
      // Token not found during request setup - silent error
      return Promise.reject({
        ...error,
        silent: true,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Retry logic with exponential backoff
const retryRequest = async <T = any>(
  requestFn: () => Promise<any>,
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error: any) {
      lastError = error;

      // Don't retry on authentication errors or user cancellation
      const shouldNotRetry =
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        error.reason === "TOKEN_NOT_FOUND" ||
        error.reason === "TOKEN_INVALID" ||
        error.reason === "ACCESS_DENIED" ||
        error.silent;

      if (shouldNotRetry || attempt === maxRetries) {
        throw error;
      }

      // Only retry on network errors, timeouts, or server errors (5xx)
      const shouldRetry =
        !error.response || // Network error
        error.code === "ECONNABORTED" || // Timeout
        error.code === "ERR_NETWORK" || // Network error
        (error.response?.status >= 500 && error.response?.status < 600); // Server error

      if (!shouldRetry) {
        throw error;
      }

      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      console.log(
        `Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// API methods
const apiService = {
  // GET request
  get: async <T = any>(url: string, params: any = {}): Promise<T> => {
    return retryRequest(() => api.get(url, { params }));
  },

  // POST request
  post: async <T = any>(url: string, data: any = {}): Promise<T> => {
    return retryRequest(() => api.post(url, data));
  },

  // PUT request
  put: async <T = any>(url: string, data: any = {}): Promise<T> => {
    return retryRequest(() => api.put(url, data));
  },

  // DELETE request
  delete: async <T = any>(url: string): Promise<T> => {
    return retryRequest(() => api.delete(url));
  },

  // PATCH request (for partial updates)
  patch: async <T = any>(url: string, data: any = {}): Promise<T> => {
    return retryRequest(() => api.patch(url, data));
  },

  // Validate token - check if current token is valid
  validateToken: async (): Promise<boolean> => {
    try {
      const token = reduxStore
        ? reduxStore.getState().auth.token
        : sessionStorage.getItem("token");
      if (!token) {
        return false;
      }

      const response = await api.get("/validate-token");
      return !!response;
    } catch (error) {
      return false;
    }
  },
};

export default apiService;

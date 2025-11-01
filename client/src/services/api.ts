import axios from "axios";

// Token validation callback - will be set by the app
let tokenInvalidCallback: ((reason: string) => void) | null = null;

// Store dispatch callback - will be set by the app to dispatch Redux actions
let storeDispatchCallback: ((action: any) => void) | null = null;

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Register callback for token validation issues
export const registerTokenInvalidCallback = (
  callback: (reason: string) => void
) => {
  tokenInvalidCallback = callback;
};

// Register Redux store dispatch for handling auth actions
export const registerStoreDispatch = (dispatch: (action: any) => void) => {
  storeDispatchCallback = dispatch;
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
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/refresh-token`,
      { refreshToken },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.data && response.data.token) {
      const newToken = response.data.token;
      sessionStorage.setItem("token", newToken);

      // Update token expiration if provided
      if (response.data.expiresIn) {
        const expirationTime =
          new Date().getTime() + response.data.expiresIn * 1000;
        localStorage.setItem("tokenExpiration", expirationTime.toString());
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
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
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

    // Get token from sessionStorage
    const token = sessionStorage.getItem("token");

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

    // Check if token is expired (basic check)
    const tokenExpiration = localStorage.getItem("tokenExpiration");
    if (tokenExpiration && new Date().getTime() > parseInt(tokenExpiration)) {
      // Token is expired - attempt refresh
      sessionStorage.removeItem("token");
      localStorage.removeItem("tokenExpiration");
      if (tokenInvalidCallback) {
        tokenInvalidCallback("TOKEN_EXPIRED");
      }
      return Promise.reject({
        message: "Session expired",
        reason: "TOKEN_EXPIRED",
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

            // Clear all authentication data
            sessionStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            localStorage.removeItem("tokenExpiration");

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

          // Clear all authentication data
          sessionStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          localStorage.removeItem("tokenExpiration");

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
    } else if (
      error.reason === "TOKEN_NOT_FOUND" ||
      error.reason === "TOKEN_EXPIRED"
    ) {
      // Token not found or expired during request setup - silent error
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

// API methods
const apiService = {
  // GET request
  get: async <T = any>(url: string, params: any = {}): Promise<T> => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async <T = any>(url: string, data: any = {}): Promise<T> => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async <T = any>(url: string, data: any = {}): Promise<T> => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async <T = any>(url: string): Promise<T> => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PATCH request (for partial updates)
  patch: async <T = any>(url: string, data: any = {}): Promise<T> => {
    try {
      const response = await api.patch(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Validate token - check if current token is valid
  validateToken: async (): Promise<boolean> => {
    try {
      const token = sessionStorage.getItem("token");
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

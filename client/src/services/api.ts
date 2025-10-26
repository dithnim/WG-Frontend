import axios from "axios";

// Token validation callback - will be set by the app
let tokenInvalidCallback: ((reason: string) => void) | null = null;

// Register callback for token validation issues
export const registerTokenInvalidCallback = (
  callback: (reason: string) => void
) => {
  tokenInvalidCallback = callback;
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
      // Token not available
      if (tokenInvalidCallback) {
        tokenInvalidCallback("SESSION_NOT_FOUND");
      }
      return Promise.reject({
        message: "No authentication token found. Please log in.",
        reason: "TOKEN_NOT_FOUND",
      });
    }

    // Check if token is expired (basic check)
    const tokenExpiration = localStorage.getItem("tokenExpiration");
    if (tokenExpiration && new Date().getTime() > parseInt(tokenExpiration)) {
      // Token is expired
      sessionStorage.removeItem("token");
      localStorage.removeItem("tokenExpiration");
      if (tokenInvalidCallback) {
        tokenInvalidCallback("TOKEN_EXPIRED");
      }
      return Promise.reject({
        message: "Your session has expired. Please log in again.",
        reason: "TOKEN_EXPIRED",
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
    // Handle common errors here
    if (error.response) {
      const status = error.response.status;

      // Handle 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        console.error("Session expired or unauthorized access");

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

        // Return a more descriptive error
        return Promise.reject({
          ...error,
          message: "Session expired. Please log in again.",
          reason: "TOKEN_INVALID",
        });
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
      // Token not found during request setup
      return Promise.reject(error);
    } else if (error.reason === "TOKEN_EXPIRED") {
      // Token expired during request setup
      return Promise.reject(error);
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

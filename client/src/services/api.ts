import axios from "axios";

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
    // Get token from localStorage
    const token = sessionStorage.getItem("token");

    // If token exists, add it to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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

        // Redirect to login page
        window.location.href = "/login";

        // Return a more descriptive error
        return Promise.reject({
          ...error,
          message: "Session expired. Please log in again.",
        });
      }

      // Handle 403 Forbidden - Access denied
      if (status === 403) {
        console.error("Access denied");
        return Promise.reject({
          ...error,
          message:
            "Access denied. You don't have permission to perform this action.",
        });
      }

      console.error("Response Error:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Request Error:", error.request);
      return Promise.reject({
        ...error,
        message: "Network error. Please check your internet connection.",
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
};

export default apiService;

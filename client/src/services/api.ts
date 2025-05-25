import axios from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { ApiResponse, ApiError, ApiConfig } from "../types/api";

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Get the token from sessionStorage
    const token = sessionStorage.getItem("token");

    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle common errors here
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Response Error:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Request Error:", error.request);
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
  get: async <T = any>(
    url: string,
    params: Record<string, any> = {}
  ): Promise<T> => {
    try {
      const response = await api.get<ApiResponse<T>>(url, { params });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async <T = any>(
    url: string,
    data: Record<string, any> = {}
  ): Promise<T> => {
    try {
      const response = await api.post<ApiResponse<T>>(url, data);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async <T = any>(
    url: string,
    data: Record<string, any> = {}
  ): Promise<T> => {
    try {
      const response = await api.put<ApiResponse<T>>(url, data);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async <T = any>(url: string): Promise<T> => {
    try {
      const response = await api.delete<ApiResponse<T>>(url);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // PATCH request (for partial updates)
  patch: async <T = any>(
    url: string,
    data: Record<string, any> = {}
  ): Promise<T> => {
    try {
      const response = await api.patch<ApiResponse<T>>(url, data);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },
};

export default apiService;

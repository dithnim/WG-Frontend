import { AxiosError, AxiosResponse } from "axios";

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: number;
}

export interface ApiError extends Omit<AxiosError, "message"> {
  response?: AxiosResponse<{
    message?: string;
  }>;
  request?: any;
  message?: string;
}

export interface Supplier {
  _id: string;
  supplierName: string;
  description?: string;
  contactNumbers?: string;
  email?: string;
  createdAt?: string;
}

export interface Product {
  _id: string;
  productName: string;
  productId: string;
  description?: string;
  rackNumber?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  category?: string;
  brand?: string;
  supplier?: string;
  createdAt?: string;
}

export interface Sale {
  _id: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  createdAt: string;
}

export interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Add Vite env type
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

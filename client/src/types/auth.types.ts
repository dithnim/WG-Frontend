/**
 * Authentication and User Types
 */

export interface User {
  username?: string;
  email?: string;
  role: string;
  name?: string;
  imageUrl?: string;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  notificationMessage: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
  userData?: User;
  user?: User;
}

export type UserRole = "admin" | "manager" | "user" | "supervisor";

export type LogoutReason =
  | "USER_LOGOUT"
  | "TOKEN_EXPIRED"
  | "TOKEN_NOT_FOUND"
  | "TOKEN_INVALID"
  | "REFRESH_TOKEN_INVALID";

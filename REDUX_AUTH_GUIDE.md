# Redux Authentication Implementation

This document explains the Redux-based authentication system implemented in the application.

## Overview

The authentication system has been migrated from React Context to Redux Toolkit for better state management, predictability, and scalability.

## File Structure

```
client/src/
├── store/
│   ├── authSlice.ts          # Redux slice for authentication
│   ├── store.ts              # Redux store configuration
│   ├── hooks.ts              # Typed Redux hooks
│   └── useAuthRedux.ts       # Custom authentication hook
├── contexts/
│   └── AuthContext.tsx       # Legacy context (now bridges to Redux)
└── services/
    └── api.ts                # API service with auth interceptors
```

## Core Components

### 1. Auth Slice (`authSlice.ts`)

The Redux slice manages authentication state and provides:

**State:**

- `user`: User object with role, email, username, etc.
- `isAuthenticated`: Boolean flag for authentication status
- `loading`: Loading state for async operations
- `error`: Error messages
- `notificationMessage`: Messages for user notifications

**Actions:**

- `loginUser`: Async thunk for user login
- `logoutUser`: Async thunk for user logout
- `validateToken`: Async thunk for token validation
- `setUser`: Synchronous action to set user
- `clearAuth`: Clear all authentication data
- `setNotificationMessage`: Set notification message
- `updateUser`: Update user information

**Selectors:**

- `selectUser`: Get current user
- `selectIsAuthenticated`: Get authentication status
- `selectAuthLoading`: Get loading state
- `selectAuthError`: Get error state
- `selectNotificationMessage`: Get notification message

### 2. Custom Hooks

#### `useAuthRedux` (Recommended)

Direct Redux hook for authentication. Use this in new components:

```typescript
import { useAuthRedux } from "../store/useAuthRedux";

function MyComponent() {
  const {
    user,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole
  } = useAuthRedux();

  // Use authentication methods
  const handleLogin = async () => {
    const success = await login(userData);
    if (success) {
      // Handle successful login
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome {user?.username}</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

#### `useAuth` (Legacy - for compatibility)

The existing `useAuth` hook from `AuthContext` has been updated to bridge to Redux, maintaining backward compatibility.

### 3. Typed Redux Hooks

Use these hooks for direct Redux access:

```typescript
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectUser, loginUser } from "../store/authSlice";

function MyComponent() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const handleLogin = async () => {
    await dispatch(loginUser(userData)).unwrap();
  };
}
```

## Usage Examples

### Login Component

```typescript
import { useAuthRedux } from "../store/useAuthRedux";

function Login() {
  const { login, error, loading } = useAuthRedux();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login({ username, password });
    if (success) {
      navigate("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

### Protected Component with Role Check

```typescript
import { useAuthRedux } from "../store/useAuthRedux";

function AdminPanel() {
  const { user, hasRole } = useAuthRedux();

  if (!hasRole("admin")) {
    return <div>Access Denied</div>;
  }

  return <div>Admin Panel Content</div>;
}
```

### Logout Component

```typescript
import { useAuthRedux } from "../store/useAuthRedux";

function LogoutButton() {
  const { logout } = useAuthRedux();

  const handleLogout = async () => {
    await logout("USER_LOGOUT");
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Direct Redux Access

For more control, use Redux directly:

```typescript
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loginUser,
  selectUser,
  selectAuthLoading
} from "../store/authSlice";

function MyComponent() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);

  const handleLogin = async (credentials: any) => {
    try {
      await dispatch(loginUser(credentials)).unwrap();
      console.log("Login successful");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div>
      {loading ? "Loading..." : user?.username}
    </div>
  );
}
```

## Role-Based Access Control

### Using Helper Functions

```typescript
import { useAuthRedux } from "../store/useAuthRedux";

function ProtectedComponent() {
  const { hasRole, hasAnyRole } = useAuthRedux();

  // Check for specific role
  if (hasRole("admin")) {
    return <AdminPanel />;
  }

  // Check for any of multiple roles
  if (hasAnyRole(["manager", "supervisor"])) {
    return <ManagerPanel />;
  }

  return <BasicUserPanel />;
}
```

### Using Selectors

```typescript
import { useAppSelector } from "../store/hooks";
import { selectUser, hasRole } from "../store/authSlice";

function Component() {
  const user = useAppSelector(selectUser);
  const isAdmin = hasRole(user, "admin");

  return isAdmin ? <AdminView /> : <UserView />;
}
```

## API Integration

The API service automatically handles authentication tokens:

1. **Token Injection**: Automatically adds Bearer token to requests
2. **Token Validation**: Validates token before requests
3. **Token Refresh**: Attempts to refresh expired tokens
4. **Error Handling**: Handles 401/403 responses appropriately

## Benefits of Redux Implementation

1. **Predictable State**: Centralized authentication state
2. **DevTools Support**: Time-travel debugging with Redux DevTools
3. **Better Testing**: Easier to test with Redux
4. **Scalability**: Easy to add new auth-related features
5. **Type Safety**: Full TypeScript support
6. **Persistence**: Automatic localStorage synchronization
7. **Side Effect Management**: Async thunks for API calls

## Migration Guide

### From AuthContext to Redux

**Before:**

```typescript
import { useAuth } from "../contexts/AuthContext";

const { user, login, logout } = useAuth();
```

**After (Recommended):**

```typescript
import { useAuthRedux } from "../store/useAuthRedux";

const { user, login, logout } = useAuthRedux();
```

**Or (Direct Redux):**

```typescript
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectUser, loginUser, logoutUser } from "../store/authSlice";

const dispatch = useAppDispatch();
const user = useAppSelector(selectUser);
```

## State Persistence

The authentication state is automatically persisted:

- **User data**: Stored in `localStorage` as `user`
- **Token**: Stored in `sessionStorage` as `token`
- **Refresh token**: Stored in `localStorage` as `refreshToken`
- **Token expiration**: Stored in `localStorage` as `tokenExpiration`

## Token Management

Token lifecycle is handled automatically:

1. **On Login**: Token is stored and user data is saved
2. **On Request**: Token is validated and added to headers
3. **On Expiration**: Automatic refresh attempt
4. **On Failure**: User is logged out and redirected

## Best Practices

1. **Use `useAuthRedux` hook** for most components
2. **Use Redux directly** for complex state management scenarios
3. **Check authentication** in route guards
4. **Validate roles** on the backend as well
5. **Handle token expiration** gracefully
6. **Clear sensitive data** on logout

## Security Considerations

1. Tokens are stored in `sessionStorage` (cleared on tab close)
2. Refresh tokens are stored in `localStorage` (persistent)
3. Token expiration is checked before each request
4. Automatic logout on token invalidation
5. Role checks are performed on both client and server

## Troubleshooting

### User is logged out unexpectedly

- Check token expiration time
- Verify refresh token is stored correctly
- Check console for API errors

### Role checks not working

- Verify user object has `role` property
- Check role values match expected strings
- Ensure user data is properly loaded

### State not persisting

- Check browser localStorage/sessionStorage
- Verify Redux DevTools for state changes
- Check for errors in browser console

## Future Enhancements

Potential improvements:

1. Add biometric authentication support
2. Implement multi-factor authentication
3. Add session management for multiple devices
4. Implement password strength validation
5. Add OAuth/SSO integration

# Redux Authentication - Quick Reference

## 🚀 Quick Start

### Import the Hook

```typescript
import { useAuthRedux } from "../store/useAuthRedux";
```

### Use in Component

```typescript
const { user, isAuthenticated, login, logout, hasRole } = useAuthRedux();
```

## 📋 Common Patterns

### Check if User is Logged In

```typescript
const { isAuthenticated } = useAuthRedux();

if (isAuthenticated) {
  // User is logged in
}
```

### Get Current User

```typescript
const { user } = useAuthRedux();

console.log(user?.username);
console.log(user?.email);
console.log(user?.role);
```

### Login User

```typescript
const { login } = useAuthRedux();

const handleLogin = async () => {
  const success = await login({
    username: "user@example.com",
    password: "password123",
  });

  if (success) {
    navigate("/dashboard");
  }
};
```

### Logout User

```typescript
const { logout } = useAuthRedux();

const handleLogout = async () => {
  await logout("USER_LOGOUT");
};
```

### Check User Role

```typescript
const { hasRole, hasAnyRole } = useAuthRedux();

// Check for specific role
if (hasRole("admin")) {
  // Show admin content
}

// Check for any of multiple roles
if (hasAnyRole(["admin", "manager"])) {
  // Show manager content
}
```

### Handle Loading State

```typescript
const { loading } = useAuthRedux();

if (loading) {
  return <LoadingSpinner />;
}
```

### Handle Errors

```typescript
const { error } = useAuthRedux();

if (error) {
  return <ErrorMessage message={error} />;
}
```

## 🔐 Protected Routes

### Redirect if Not Authenticated

```typescript
const ProtectedPage = () => {
  const { isAuthenticated, loading } = useAuthRedux();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Protected Content</div>;
};
```

### Role-Based Content

```typescript
const AdminPanel = () => {
  const { hasRole } = useAuthRedux();

  if (!hasRole("admin")) {
    return <div>Access Denied</div>;
  }

  return <div>Admin Panel</div>;
};
```

## 🎯 Direct Redux Access (Advanced)

### Import Redux Hooks

```typescript
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  selectUser,
  selectIsAuthenticated,
  loginUser,
} from "../store/authSlice";
```

### Use Redux Selectors

```typescript
const user = useAppSelector(selectUser);
const isAuthenticated = useAppSelector(selectIsAuthenticated);
```

### Dispatch Actions

```typescript
const dispatch = useAppDispatch();

// Login
await dispatch(loginUser(userData)).unwrap();

// Logout
await dispatch(logoutUser("USER_LOGOUT")).unwrap();
```

## 📊 Available Selectors

```typescript
import {
  selectUser, // Current user object
  selectIsAuthenticated, // Boolean authentication status
  selectAuthLoading, // Loading state
  selectAuthError, // Error message
  selectNotificationMessage, // Notification message
} from "../store/authSlice";
```

## 🛠️ Available Actions

```typescript
import {
  loginUser, // Login action (async thunk)
  logoutUser, // Logout action (async thunk)
  validateToken, // Validate token (async thunk)
  setUser, // Set user synchronously
  clearAuth, // Clear all auth data
  updateUser, // Update user data
} from "../store/authSlice";
```

## ⚡ Helper Functions

```typescript
import { hasRole, hasAnyRole } from "../store/authSlice";

const isAdmin = hasRole(user, "admin");
const isManager = hasAnyRole(user, ["admin", "manager"]);
```

## 🔄 Token Management

### Tokens are Managed Automatically

- Access token: `sessionStorage.getItem("token")`
- Refresh token: `localStorage.getItem("refreshToken")`
- Expiration: `localStorage.getItem("tokenExpiration")`

### Manual Token Validation

```typescript
const { validateToken } = useAuthRedux();

const isValid = await validateToken();
```

## 📝 TypeScript Types

```typescript
import { User, LogoutReason } from "../types/auth.types";

const user: User = {
  username: "john",
  email: "john@example.com",
  role: "admin",
};

const reason: LogoutReason = "USER_LOGOUT";
```

## 🎨 Complete Example Component

```typescript
import React from "react";
import { useAuthRedux } from "../store/useAuthRedux";
import { useNavigate } from "react-router-dom";

export const MyComponent: React.FC = () => {
  const { user, isAuthenticated, login, logout, hasRole, loading, error } = useAuthRedux();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const success = await login({ username: "test", password: "test" });
    if (success) navigate("/dashboard");
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.username}!</p>
          {hasRole("admin") && <p>Admin Access</p>}
          <button onClick={() => logout("USER_LOGOUT")}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
};
```

## 🆘 Common Issues

### Issue: User state not updating

**Solution**: Check Redux DevTools to see if action is dispatched

### Issue: Redirecting too early

**Solution**: Check `loading` state before redirecting

### Issue: Role check not working

**Solution**: Ensure user object has `role` property

### Issue: Token expired errors

**Solution**: Check `tokenExpiration` in localStorage

## 📚 Resources

- **Full Guide**: See `REDUX_AUTH_GUIDE.md`
- **Examples**: See `client/src/Components/examples/ReduxAuthExamples.tsx`
- **Implementation**: See `REDUX_AUTH_IMPLEMENTATION_SUMMARY.md`

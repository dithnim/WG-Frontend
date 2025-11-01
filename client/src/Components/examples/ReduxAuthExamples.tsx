/**
 * Example Component: Using Redux for Authentication
 *
 * This file demonstrates various ways to use Redux-based authentication
 * in your components. You can use either the useAuthRedux hook or
 * direct Redux hooks depending on your needs.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthRedux } from "../../store/useAuthRedux";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  loginUser,
  logoutUser,
} from "../../store/authSlice";

/**
 * Example 1: Using useAuthRedux Hook (Recommended)
 * This is the simplest way to use authentication in your components
 */
export const Example1_UseAuthReduxHook: React.FC = () => {
  const { user, isAuthenticated, login, logout, hasRole, loading } =
    useAuthRedux();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const userData = {
      username: "testuser",
      password: "password123",
    };

    const success = await login(userData);
    if (success) {
      navigate("/dashboard");
    }
  };

  const handleLogout = async () => {
    await logout("USER_LOGOUT");
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded">
      <h2 className="text-xl font-bold mb-4">
        Example 1: Using useAuthRedux Hook
      </h2>

      {loading && <p>Loading...</p>}

      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.username}!</p>
          <p>Role: {user?.role}</p>

          {hasRole("admin") && (
            <p className="text-green-400">You have admin access</p>
          )}

          <button
            onClick={handleLogout}
            className="mt-2 bg-red-500 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      ) : (
        <button onClick={handleLogin} className="bg-blue-500 px-4 py-2 rounded">
          Login
        </button>
      )}
    </div>
  );
};

/**
 * Example 2: Using Direct Redux Hooks
 * Use this when you need more control over Redux state and actions
 */
export const Example2_DirectReduxHooks: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);

  const handleLogin = async () => {
    try {
      const result = await dispatch(
        loginUser({
          username: "testuser",
          userData: {
            email: "test@example.com",
            role: "admin",
          },
        })
      ).unwrap();

      console.log("Login successful:", result);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser("USER_LOGOUT")).unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded mt-4">
      <h2 className="text-xl font-bold mb-4">Example 2: Direct Redux Hooks</h2>

      {loading && <p>Loading...</p>}

      <div>
        <p>Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
        {user && (
          <div className="mt-2">
            <p>Username: {user.username}</p>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
          </div>
        )}

        <div className="mt-4 space-x-2">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-blue-500 px-4 py-2 rounded disabled:opacity-50"
          >
            Login
          </button>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              disabled={loading}
              className="bg-red-500 px-4 py-2 rounded disabled:opacity-50"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Example 3: Role-Based Component
 * Shows how to implement role-based access control
 */
export const Example3_RoleBasedComponent: React.FC = () => {
  const { user, hasRole, hasAnyRole } = useAuthRedux();

  if (!user) {
    return (
      <div className="p-4 bg-gray-800 text-white rounded mt-4">
        <p>Please login to view this content</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded mt-4">
      <h2 className="text-xl font-bold mb-4">
        Example 3: Role-Based Access Control
      </h2>

      <div className="space-y-2">
        {hasRole("admin") && (
          <div className="bg-red-900 p-2 rounded">
            <p className="font-bold">Admin Section</p>
            <p>Only admins can see this</p>
          </div>
        )}

        {hasAnyRole(["admin", "manager"]) && (
          <div className="bg-blue-900 p-2 rounded">
            <p className="font-bold">Management Section</p>
            <p>Admins and managers can see this</p>
          </div>
        )}

        {hasAnyRole(["admin", "manager", "user"]) && (
          <div className="bg-green-900 p-2 rounded">
            <p className="font-bold">User Section</p>
            <p>All authenticated users can see this</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Example 4: Protected Component with Redirect
 * Shows how to protect a component and redirect if not authenticated
 */
export const Example4_ProtectedComponent: React.FC = () => {
  const { isAuthenticated, loading } = useAuthRedux();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 text-white rounded mt-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded mt-4">
      <h2 className="text-xl font-bold mb-4">Example 4: Protected Content</h2>
      <p>This content is only visible to authenticated users</p>
    </div>
  );
};

/**
 * Example 5: Login Form with Error Handling
 * Shows a complete login form with error handling
 */
export const Example5_LoginForm: React.FC = () => {
  const { login, loading, error } = useAuthRedux();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!username || !password) {
      setLocalError("Please enter username and password");
      return;
    }

    const success = await login({ username, password });

    if (success) {
      navigate("/dashboard");
    } else {
      setLocalError("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded mt-4">
      <h2 className="text-xl font-bold mb-4">Example 5: Login Form</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(error || localError) && (
          <div className="bg-red-500 p-2 rounded">
            <p>{error || localError}</p>
          </div>
        )}

        <div>
          <label className="block mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded"
            placeholder="Enter username"
          />
        </div>

        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded"
            placeholder="Enter password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

/**
 * Main Examples Container
 * Renders all examples together
 */
export const ReduxAuthExamples: React.FC = () => {
  return (
    <div className="container mx-auto p-8 bg-[#0f0f0f]">
      <h1 className="text-3xl font-bold text-white mb-6">
        Redux Authentication Examples
      </h1>

      <Example1_UseAuthReduxHook />
      <Example2_DirectReduxHooks />
      <Example3_RoleBasedComponent />
      <Example4_ProtectedComponent />
      <Example5_LoginForm />
    </div>
  );
};

export default ReduxAuthExamples;

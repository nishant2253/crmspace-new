import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout as apiLogout } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      console.log("Checking authentication status...");
      const userData = await getCurrentUser();
      console.log("User authenticated:", userData);
      setUser(userData);
      setError(null);
    } catch (err) {
      console.log("Authentication failed:", err.message);
      setUser(null);
      if (err.response?.status === 401) {
        setError("Not authenticated");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch user on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check for authentication after redirects
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authSuccess = params.get("auth") === "success";

    if (authSuccess) {
      checkAuthStatus();
      // Clear the URL parameters
      navigate(location.pathname, { replace: true });
    }
  }, [location.search]);

  // Improved logout: clear user, redirect, handle errors
  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error("Logout error:", err);
      // Ignore network errors on logout
    } finally {
      setUser(null);
      navigate("/get-started", { replace: true });
    }
  };

  // Handle session expiration: if user is null and not loading, redirect to login
  // But don't redirect if on the get-started or login page
  useEffect(() => {
    const isPublicRoute =
      location.pathname === "/get-started" || location.pathname === "/login";

    if (!loading && !user && !isPublicRoute) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, logout, checkAuthStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

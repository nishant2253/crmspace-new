import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI, testAPI } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("Initializing auth state...");
        setLoading(true);
        const userData = await authAPI.getCurrentUser();
        console.log("User data received:", userData);
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error("Authentication error:", err);
        setUser(null);
        setError(err.message);

        // Try to get debug info
        try {
          const authStatus = await testAPI.checkAuthStatus();
          const dbStatus = await testAPI.checkDbStatus();
          setDebugInfo({ authStatus, dbStatus });
          console.log("Debug info:", { authStatus, dbStatus });
        } catch (debugErr) {
          console.error("Failed to get debug info:", debugErr);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login with Google
  const loginWithGoogle = () => {
    console.log("Initiating Google login...");
    authAPI.loginWithGoogle();
  };

  // Logout
  const logout = async () => {
    try {
      console.log("Logging out...");
      await authAPI.logout();
      setUser(null);
      console.log("Logout successful");
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message);
    }
  };

  // Check auth status for debugging
  const checkAuthStatus = async () => {
    try {
      const authStatus = await testAPI.checkAuthStatus();
      const dbStatus = await testAPI.checkDbStatus();
      setDebugInfo({ authStatus, dbStatus });
      return { authStatus, dbStatus };
    } catch (err) {
      console.error("Failed to check auth status:", err);
      setError(err.message);
      return null;
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

  // Context value
  const value = {
    user,
    loading,
    error,
    debugInfo,
    loginWithGoogle,
    logout,
    checkAuthStatus,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;

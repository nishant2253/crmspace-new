import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();

  // Handle URL parameters for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get("auth");
    const authError = urlParams.get("error");
    const errorMsg = urlParams.get("message");

    if (authSuccess === "success") {
      console.log("Auth success detected in URL");
      // Remove the query parameter and reload
      window.history.replaceState({}, document.title, window.location.pathname);
      checkAuth();
    }

    if (authError) {
      console.error("Auth error detected in URL:", authError, errorMsg || "");
      setError(`Authentication failed: ${errorMsg || authError}`);
      setLoading(false);
      setAuthInitialized(true);
    }
  }, []);

  // Check authentication status
  const checkAuth = async () => {
    console.log("Checking authentication status...");
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/auth/me");
      console.log("Auth check response:", response.data);
      setUser(response.data);
      setAuthInitialized(true);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to get current user:",
        error.response?.status,
        error.response?.data
      );
      setUser(null);
      if (error.response?.status !== 401) {
        // Only set error for non-401 responses, as 401 is expected for non-authenticated users
        setError(`Authentication failed: ${error.message}`);
      }
      setAuthInitialized(true);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initialize authentication on page load
  useEffect(() => {
    checkAuth();

    // Set up an interval to periodically check auth status (useful for session expiry)
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  // Login by redirecting to Google OAuth
  const login = () => {
    console.log("Initiating login...");
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  };

  // Logout user
  const logout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        checkAuth,
        isAuthenticated: Boolean(user),
        authInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;

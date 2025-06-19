import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../services/api";

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
    const authToken = urlParams.get("token");

    if (authSuccess === "success" && authToken) {
      console.log("Auth success with token detected in URL");
      // Remove the query parameter and reload
      window.history.replaceState({}, document.title, window.location.pathname);

      // Verify the token
      verifyToken(authToken);
    } else if (authSuccess === "success") {
      console.log("Auth success without token detected in URL");
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

  // Verify token from URL
  const verifyToken = async (token) => {
    console.log("Verifying token:", token);
    setLoading(true);
    setError(null);

    try {
      // Set the token for API calls
      setAuthToken(token);

      const response = await api.post("/auth/verify-token", { token });
      console.log("Token verification response:", response.data);

      if (response.data.success) {
        // If the token is valid, check authentication again
        localStorage.setItem("authToken", token); // Store the token
        await checkAuth();
      } else {
        setUser(null);
        setAuthToken(null); // Clear the token
        localStorage.removeItem("authToken");
        setError("Failed to verify authentication token");
        setAuthInitialized(true);
        setLoading(false);
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      setUser(null);
      setAuthToken(null); // Clear the token
      localStorage.removeItem("authToken");
      setError(`Authentication failed: ${error.message}`);
      setAuthInitialized(true);
      setLoading(false);
    }
  };

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
    // Check if we have a saved token
    const savedToken = localStorage.getItem("authToken");
    if (savedToken) {
      console.log("Found saved token, verifying...");
      verifyToken(savedToken);
    } else {
      checkAuth();
    }

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
      setAuthToken(null); // Clear the token
      localStorage.removeItem("authToken");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      setUser(null);
      setAuthToken(null);
      localStorage.removeItem("authToken");
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

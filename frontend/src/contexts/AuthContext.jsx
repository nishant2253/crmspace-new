import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout as apiLogout, testAuth } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user on mount with improved error handling
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First try the test endpoint
        const testResult = await testAuth();
        console.log("Auth test result:", testResult);

        if (testResult.isAuthenticated && testResult.user) {
          setUser(testResult.user);
          setAuthError(null);
        } else {
          // Fallback to regular endpoint
          const userData = await getCurrentUser();
          setUser(userData);
          setAuthError(null);
        }
      } catch (err) {
        console.error("Authentication error:", err);
        setUser(null);
        setAuthError(err.message || "Failed to authenticate");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

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
    <AuthContext.Provider value={{ user, loading, authError, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

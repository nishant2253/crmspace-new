import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout as apiLogout } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user on mount with retry logic
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 2;

    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        const userData = await getCurrentUser();
        if (isMounted) {
          console.log("Authentication successful:", userData);
          setUser(userData);
          setAuthError(null);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        if (isMounted) {
          setUser(null);
          setAuthError(error.message || "Authentication failed");

          // Retry authentication if we haven't reached max retries
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(
              `Retrying authentication (${retryCount}/${maxRetries})...`
            );
            setTimeout(checkAuth, 1000); // Wait 1 second before retrying
            return;
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Improved logout: clear user, redirect, handle errors
  const logout = async () => {
    // Always clear the user state first for a responsive UI
    setUser(null);

    try {
      // Then attempt to logout on the server
      const success = await apiLogout();
      if (!success) {
        console.warn(
          "Server logout may have failed, but local state is cleared"
        );
      }
    } catch (err) {
      console.error("Logout error:", err);
      // Ignore network errors on logout
    } finally {
      // Always navigate to get-started page
      navigate("/get-started", { replace: true });
    }
  };

  // Set guest user directly without reloading
  const setGuestUser = (guestUser) => {
    setUser(guestUser);
    setAuthError(null);
    navigate("/dashboard", { replace: true });
  };

  // Handle session expiration: if user is null and not loading, redirect to login
  // But don't redirect if on the get-started or login page
  useEffect(() => {
    const isPublicRoute =
      location.pathname === "/get-started" || location.pathname === "/login";

    if (!loading && !user && !isPublicRoute) {
      console.log("No authenticated user, redirecting to login");
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  // Check if the current user is a guest
  const isGuestUser = user && user.isGuest === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        isGuestUser,
        setUser,
        setGuestUser,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

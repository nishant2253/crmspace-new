import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout as apiLogout } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user on mount
  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
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
    navigate("/dashboard", { replace: true });
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

  // Check if the current user is a guest
  const isGuestUser = user && user.isGuest === true;

  return (
    <AuthContext.Provider
      value={{ user, loading, logout, isGuestUser, setUser, setGuestUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

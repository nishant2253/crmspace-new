import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout as apiLogout } from "../services/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user on mount
  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Improved logout: clear user, redirect, handle errors
  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  // Handle session expiration: if user is null and not loading, redirect to login
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

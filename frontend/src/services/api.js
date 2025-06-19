import axios from "axios";

// Get API base URL from environment or use default
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://crmspace2253.vercel.app";

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      throw error;
    }
  },

  // Login with Google (redirects to Google)
  loginWithGoogle: () => {
    console.log("Redirecting to Google OAuth");
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.get("/auth/logout");
      return response.data;
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  },
};

// Test API endpoints
export const testAPI = {
  // Test database connection
  checkDbStatus: async () => {
    try {
      const response = await api.get("/test/db-status");
      return response.data;
    } catch (error) {
      console.error("Error checking DB status:", error);
      throw error;
    }
  },

  // Test authentication status
  checkAuthStatus: async () => {
    try {
      const response = await api.get("/test/auth-status");
      return response.data;
    } catch (error) {
      console.error("Error checking auth status:", error);
      throw error;
    }
  },
};

// Export the API instance
export default api;

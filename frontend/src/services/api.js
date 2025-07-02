import axios from "axios";

// In production (Vercel), use the production API URL
// In development, use the localhost URL
const isProd = import.meta.env.PROD;
const API_BASE_URL = isProd
  ? import.meta.env.VITE_PROD_API_BASE_URL ||
    "https://crmspace-backend.vercel.app"
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:5003";

console.log("API Service initialized with base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send cookies for session auth
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const loginWithGoogle = () => {
  console.log("Redirecting to Google login at:", `${API_BASE_URL}/auth/google`);
  window.location.href = `${API_BASE_URL}/auth/google`;
};

export const loginAsGuest = async () => {
  console.log("Logging in as guest");
  try {
    const response = await api.get("/auth/guest");
    console.log("Guest login response:", response);

    // Instead of reloading the page, return the user data
    // The component will handle updating the auth state
    return response.data.user;
  } catch (error) {
    console.error("Guest login failed:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // Use only the Accept header which is CORS-safelisted
    const response = await api.get("/auth/logout", {
      headers: {
        Accept: "application/json",
      },
    });
    return true;
  } catch (error) {
    console.error("Logout failed:", error);
    // Even if the API call fails, we want to clear local state
    // This ensures the user can still "log out" locally
    return true;
  }
};

export const getCurrentUser = async () => {
  try {
    console.log("Checking current user authentication");
    const res = await api.get("/auth/me");
    console.log("Current user:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "Authentication check failed:",
      error.response?.status,
      error.message
    );
    throw error;
  }
};

export const apiGet = async (url) => {
  const res = await api.get(url);
  return res.data;
};

export const apiPost = async (url, data) => {
  const res = await api.post(url, data);
  return res.data;
};

// Function to post to test endpoints (no credentials)
export const apiPostNoCredentials = async (url, data) => {
  try {
    console.log(
      "Making request to",
      `${API_BASE_URL}${url}`,
      "with data",
      data
    );
    const res = await axios({
      method: "post",
      url: `${API_BASE_URL}${url}`,
      data: data,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: false,
    });
    console.log("Response:", res.data);
    return res.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default api;

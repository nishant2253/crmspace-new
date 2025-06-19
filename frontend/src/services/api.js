import axios from "axios";

// In production (Vercel), use the production API URL
// In development, use the localhost URL
const isProd = import.meta.env.PROD;
const API_BASE_URL = isProd
  ? import.meta.env.VITE_PROD_API_BASE_URL || "https://crmspace2253.vercel.app"
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:5003";

console.log("API Base URL:", API_BASE_URL); // Log the API URL for debugging

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send cookies for session auth
});

export const loginWithGoogle = () => {
  console.log("Redirecting to Google OAuth:", `${API_BASE_URL}/auth/google`);
  window.location.href = `${API_BASE_URL}/auth/google`;
};

export const logout = async () => {
  try {
    await api.get("/auth/logout");
    return true;
  } catch (error) {
    console.error("Logout failed:", error);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const res = await api.get("/auth/me");
    console.log("Current user data:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error getting current user:", error);
    throw error;
  }
};

// Test authentication status
export const testAuth = async () => {
  try {
    const res = await api.get("/auth/test-auth");
    console.log("Auth test result:", res.data);
    return res.data;
  } catch (error) {
    console.error("Auth test failed:", error);
    return { isAuthenticated: false, error: error.message };
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

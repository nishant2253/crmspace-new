import axios from "axios";

// In production (Vercel), use the production API URL
// In development, use the localhost URL
const isProd = import.meta.env.PROD;
const API_BASE_URL = isProd
  ? import.meta.env.VITE_PROD_API_BASE_URL || "https://crmspace2253.vercel.app"
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:5003";

// Remove trailing slash if present
const cleanBaseUrl = API_BASE_URL.endsWith("/")
  ? API_BASE_URL.slice(0, -1)
  : API_BASE_URL;

console.log("API Base URL:", cleanBaseUrl);

const api = axios.create({
  baseURL: cleanBaseUrl,
  withCredentials: true, // send cookies for session auth
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    // Make sure there's no double slash in the URL
    if (config.url.startsWith("/")) {
      console.log(
        `Making ${config.method.toUpperCase()} request to: ${config.baseURL}${
          config.url
        }`
      );
    } else {
      console.log(
        `Making ${config.method.toUpperCase()} request to: ${config.baseURL}/${
          config.url
        }`
      );
      config.url = `/${config.url}`; // Ensure URL starts with /
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(
      "API Error:",
      error.response?.status,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export const loginWithGoogle = () => {
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
    return res.data;
  } catch (error) {
    console.error(
      "Failed to get current user:",
      error.response?.status,
      error.response?.data
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

import axios from "axios";

// Normalize base URL: strip trailing slashes to prevent malformed route joining
const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Authorization header if token exists in localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("flowpilot_token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("flowpilot_token");
        localStorage.removeItem("flowpilot_user");

        // Avoid redirecting if already on public auth pages
        const pathname = window.location.pathname;
        if (!pathname.startsWith("/login") && !pathname.startsWith("/register") && pathname !== "/") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
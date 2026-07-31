import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Central place to attach interceptors later (e.g. token refresh, logging)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // NOTE: no auth/token refresh logic yet - this phase is scaffolding only
    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";

import { API_URL } from "./config";
import { useAuthStore } from "../store/auth-store";

function normalizeApiError(error) {
  const message =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Request failed";
  return new Error(message);
}

const refreshClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

client.interceptors.request.use((request) => {
  const token = useAuthStore.getState().token;
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const { refreshToken, logout, setSession } = useAuthStore.getState();

    if (status === 401 && refreshToken && !originalRequest._retry && !originalRequest.url?.includes("/api/auth/refresh")) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshClient
            .post("/api/auth/refresh", { refresh_token: refreshToken })
            .then((response) => response.data)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const refreshed = await refreshPromise;
        setSession(refreshed);
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${refreshed.access_token || refreshed.token}`,
        };
        return client(originalRequest);
      } catch (refreshError) {
        logout();
        throw normalizeApiError(refreshError);
      }
    }

    throw normalizeApiError(error);
  },
);

async function request(config) {
  const response = await client(config);
  return response.data;
}

export const api = {
  get(url, config) {
    return request({ ...config, method: "GET", url });
  },
  post(url, data, config) {
    return request({ ...config, method: "POST", url, data });
  },
  patch(url, data, config) {
    return request({ ...config, method: "PATCH", url, data });
  },
  put(url, data, config) {
    return request({ ...config, method: "PUT", url, data });
  },
  delete(url, config) {
    return request({ ...config, method: "DELETE", url });
  },
};

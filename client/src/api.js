import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("yeros_token");
  if (token && !config.skipAdminAuth) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const publicSession = error.config?.skipAdminAuth || error.config?.url?.includes("/portal/") || error.config?.url?.includes("/public/");
    if (error.response?.status === 401 && !error.config.url.endsWith("/auth/login") && !publicSession) {
      localStorage.removeItem("yeros_token");
      localStorage.removeItem("yeros_user");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error) {
  return error.response?.data?.message || error.message || "Something went wrong";
}

export default api;

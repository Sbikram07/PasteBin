import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
});

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("inkbin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Auth ----
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const fetchMe = () => api.get("/auth/me");

// ---- Pastes ----
export const createPaste = (data) => api.post("/pastes", data);
export const fetchPaste = (id, password) =>
  api.get(`/pastes/${id}`, { params: password ? { password } : {} });
export const fetchStats = (id) => api.get(`/pastes/${id}/stats`);
export const deletePaste = (id, { deleteToken } = {}) =>
  api.delete(`/pastes/${id}`, {
    headers: deleteToken ? { "x-delete-token": deleteToken } : {},
  });
export const fetchMyPastes = (page = 1) =>
  api.get("/pastes/mine", { params: { page } });

export const rawPasteUrl = (id, password) => {
  const base = (import.meta.env.VITE_API_URL || "/api") + `/pastes/${id}/raw`;
  return password ? `${base}?password=${encodeURIComponent(password)}` : base;
};

export default api;

import axios from "axios";

const BACKEND = import.meta.env.VITE_CT1_BACKEND || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BACKEND,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

export async function getTours(params = {}) {
  const res = await api.get(`/api/tours`, { params });
  return res.data;
}

// Try to fetch a single tour by id. If the backend doesn't support it,
// this will throw and caller can fallback to list-based lookup.
export async function getTourById(id) {
  if (!id) throw new Error("Missing tour id");
  const res = await api.get(`/api/tours/${id}`);
  return res.data;
}

import axios from "axios";

// Uses the same backend as tours (bookingtocbs)
const BACKEND = import.meta.env.VITE_CT1_BACKEND || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BACKEND,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

export async function getTourPackages(params = {}) {
  const res = await api.get(`/api/tour-packages`, { params });
  return res.data;
}

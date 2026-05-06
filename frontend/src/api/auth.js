import axios from "axios";

const backendUri =
  import.meta.env.VITE_CT1_BACKEND || "https://back.bookingtocbs.jampzdev.com";

const authUri =
  import.meta.env.VITE_AUTH_BACKEND || "https://back.bookingtocbs.jampzdev.com";

const api = axios.create({
  baseURL: backendUri,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

const authApi = axios.create({
  baseURL: authUri,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

export async function registerCustomer(payload) {
  const res = await authApi.post("/api/auth/register", payload);
  return res.data;
}

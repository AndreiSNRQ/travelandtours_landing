import axios from 'axios'

export const AUTH_API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_BACKEND,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// No longer need manual XSRF token attachment for token-based auth flow

export const getCsrfCookie = async () => {
  return AUTH_API.get("/sanctum/csrf-cookie");
};

/**
 * API HELPERS
 */
export const requestOtp = async (email, password) => {
  return AUTH_API.post("/api/auth/login", { email, password });
};

export const verifyOtp = async (email, otp, deviceFingerprint) => {
  return AUTH_API.post("/api/auth/otp/verify", { email, otp });
};

export const resendOtp = async (email, deviceFingerprint) => {
  return AUTH_API.post("/api/auth/otp/resend", { email });
};

export const refreshSession = async () => {
  return AUTH_API.post("/api/auth/refresh-token");
};

export const fetchUser = async () => {
  return AUTH_API.get("/api/user");
};

export const logout = async (deviceFingerprint) => {
  return AUTH_API.post("/api/logout");
};

export default AUTH_API

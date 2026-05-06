import axios from "axios";

const BACKEND =
  import.meta.env.VITE_TOURS_API_URL ||
  import.meta.env.VITE_CT1_BACKEND ||
  "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BACKEND,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/**
 * Resolve customer identity from auth object.
 * We prioritize email (stable), then phone, then fallback id (legacy).
 */
function resolveCustomerIdentity(auth) {
  const email =
    auth?.email ||
    auth?.user?.email ||
    auth?.data?.email ||
    auth?.customer?.email ||
    "";

  // Phone may be stored in different fields
  const phone =
    auth?.phone ||
    auth?.contact_phone ||
    auth?.mobile ||
    auth?.user?.phone ||
    auth?.user?.contact_phone ||
    auth?.data?.phone ||
    auth?.customer?.phone ||
    "";

  // Legacy id (optional, only as fallback)
  const id =
    auth?.id ||
    auth?.user_id ||
    auth?.user?.id ||
    auth?.user?.user_id ||
    auth?.data?.id ||
    auth?.customer?.id ||
    null;

  return {
    email: String(email || "").trim(),
    phone: String(phone || "").trim(),
    id: id ? String(id) : "",
  };
}

/**
 * Headers expected by bookingtocbs middleware:
 * - X-JOLI-API-KEY
 * - X-CUSTOMER-EMAIL or X-CUSTOMER-PHONE
 */
function buildHeaders(auth) {
  const apiKey = (import.meta.env.VITE_JOLI_API_KEY || "").trim();
  const { email, phone, id } = resolveCustomerIdentity(auth);

  const headers = {
    "X-JOLI-API-KEY": apiKey,
    // include both; backend will accept whichever it needs
    "X-CUSTOMER-EMAIL": email,
    "X-CUSTOMER-PHONE": phone,
  };

  // Optional legacy header (won't hurt, but backend should not rely on it)
  if (id) headers["X-CUSTOMER-ID"] = id;

  return headers;
}

export async function createBooking(payload, auth) {
  const res = await api.post(`/api/bookings`, payload, {
    headers: buildHeaders(auth),
  });
  return res.data;
}

export async function getMyBookings(auth) {
  const res = await api.get(`/api/my-bookings`, {
    headers: buildHeaders(auth),
  });
  return res.data;
}

export async function rateBooking(bookingId, payload, auth) {
  const res = await api.post(`/api/my-bookings/${bookingId}/rate`, payload, {
    headers: buildHeaders(auth),
  });
  return res.data;
}

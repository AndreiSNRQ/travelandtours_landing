import axios from "axios";

const BACKEND = import.meta.env.VITE_CT1_BACKEND || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BACKEND,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const unwrap = (res) => res?.data?.data ?? res?.data ?? [];

const isNotFoundish = (err) => {
  const s = err?.response?.status;
  return s === 404 || s === 405;
};

/**
 * Get itineraries by tour id with fallbacks (because backend route differs).
 */
export async function getItineraryByTour(tourId) {
  if (!tourId) return [];

  const endpoints = [
    `/api/itineraries/tour/${tourId}`,
    `/api/tours/${tourId}/itineraries`,
    `/api/itineraries?tour_id=${encodeURIComponent(tourId)}`,
    `/api/itinerary/tour/${tourId}`,
  ];

  let lastErr = null;

  for (const url of endpoints) {
    try {
      const res = await api.get(url);
      const data = unwrap(res);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      lastErr = err;
      if (!isNotFoundish(err)) throw err; // real error: stop
      // else: try next endpoint
    }
  }

  // if all 404/405
  console.warn("Itinerary endpoints not found. Last error:", lastErr);
  return [];
}

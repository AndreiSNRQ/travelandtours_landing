import api from './axios'

const BASE = import.meta.env.VITE_TOURS_API_URL || 'http://127.0.0.1:8000/api'

// Tours API
export async function getTours(params = {}) {
    const res = await api.get(`${BASE}/api/tours`, { params })
    return res.data
}

export async function getTour(id) {
    const res = await api.get(`${BASE}/api/tours/${id}`)
    return res.data
}

// Itineraries API
export async function getItineraryByTour(tourId, params = {}) {
    if (!tourId) return []
    // Try nested resource first, then fallback to flat resource with filter
    try {
        const res = await api.get(`${BASE}/api/tours/${tourId}/itineraries`, { params })
        return normalizeResponse(res)
    } catch (_) {
        const res = await api.get(`${BASE}/api/itineraries`, { params: { tour_id: tourId, ...params } })
        return normalizeResponse(res)
    }
}

export async function getItineraries(params = {}) {
    const res = await api.get(`${BASE}/api/itineraries`, { params })
    return res.data
}

export async function getReviews(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = `${BASE}/api/reviews${queryString ? '?' + queryString : ''}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch reviews')
  }
  return response.json()
}

function normalizeResponse(res) {
    const payload = res?.data
    const items = Array.isArray(payload)
        ? payload
        : (payload?.data?.data || payload?.data || payload?.itineraries || [])
    // Sort by sort_order, then day_number
    return items.slice().sort((a, b) => {
        const soA = a.sort_order ?? 0
        const soB = b.sort_order ?? 0
        if (soA !== soB) return soA - soB
        const dA = a.day_number ?? 0
        const dB = b.day_number ?? 0
        return dA - dB
    })
}

export default {
    getTours,
    getTour,
    getItineraryByTour,
    getItineraries,
    getReviews
}

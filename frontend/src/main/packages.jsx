import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import Header from "@/components/core1/header"
import FadeIn from "@/components/core1/fade-in"
import Footer from "@/components/core1/footer"
import wallpaperHeader from "@/assets/wallpaper-header-2.jpg"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { getTourPackages } from "@/api/tourPackages"

/** ---------------- helpers ---------------- */

const toNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const peso = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(toNumber(n))

/**
 * Safe: turn a possibly-relative path into a URL.
 * If your tours already return absolute URLs, it will keep them.
 */
function makeMediaResolver(storageBase) {
  const isAbsoluteUrl = (v = "") => /^https?:\/\//i.test(String(v).trim())
  const trimLeadingSlashes = (v = "") => String(v || "").replace(/^\/+/, "")

  return function resolveMediaUrl(value) {
    if (!value) return ""
    const v = String(value).trim()
    if (!v) return ""
    if (isAbsoluteUrl(v)) return v

    // if it's a laravel "/storage/..." path, attach to storageBase (or keep relative)
    if (v.startsWith("/storage/") || v.startsWith("storage/")) {
      const root = storageBase ? storageBase.replace(/\/storage\/?$/, "") : ""
      return root ? `${root}/${trimLeadingSlashes(v)}` : `/${trimLeadingSlashes(v)}`
    }

    // generic relative path
    return storageBase ? `${storageBase}/${trimLeadingSlashes(v)}` : v
  }
}

/**
 * Extract possible cover fields from a Tour record.
 * Keep this conservative (no guessing beyond known fields).
 */
function pickTourCoverFactory(resolveMediaUrl) {
  return function pickTourCover(tour) {
    if (!tour || typeof tour !== "object") return ""
    const raw =
      tour.thumbnail ||
      tour.image ||
      tour.cover ||
      tour.main_image ||
      tour.photo ||
      ""
    return resolveMediaUrl(raw)
  }
}

/** ---------------- component ---------------- */

export default function PackagesPage() {
  const navigate = useNavigate()

  // If empty, relative URLs will still work if on same domain.
  // If your images are hosted elsewhere, put VITE_CT1_STORAGE_URL.
  const storageBase = import.meta.env.VITE_CT1_STORAGE_URL || ""
  const resolveMediaUrl = useMemo(() => makeMediaResolver(storageBase), [storageBase])
  const pickTourCover = useMemo(() => pickTourCoverFactory(resolveMediaUrl), [resolveMediaUrl])

  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [active, setActive] = useState(null)

  // Option A total value: sum tour prices (computed on frontend)
  const packageValue = (p) => {
    const tours = Array.isArray(p?.tours) ? p.tours : []
    return tours.reduce((sum, t) => sum + toNumber(t?.price), 0)
  }

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await getTourPackages({ per_page: 100 })

      // Accept either {data: []} or [] from API (defensive)
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      setPackages(items)
    } catch (e) {
      const msg = e?.message || "Failed to load tour packages"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cards = useMemo(() => packages, [packages])

  return (
    <div>
        {/* HERO */}
        <div
        className="w-full h-[520px] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${wallpaperHeader})` }}
        >
        {/* Ensure header is on top */}
        <div className="relative z-20">
            <Header />
        </div>

        {/* Make overlay NOT block clicks/hover */}
        <FadeIn className="absolute inset-0 z-10 flex items-center justify-center px-4 pointer-events-none">
            <div className="text-center max-w-2xl pointer-events-none">
            <h1 className="text-white text-4xl md:text-5xl font-bold drop-shadow">
                Tour Packages
            </h1>
            <p className="text-white/90 mt-3 text-base md:text-lg drop-shadow">
                Explore curated bundles made from multiple tours.
            </p>
            </div>
        </FadeIn>
        </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 pb-16">
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Available Packages</h2>
                <p className="text-sm text-muted-foreground">
                  Total value is computed as the sum of included tours.
                </p>
              </div>

              <Button variant="outline" onClick={load} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mt-6">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading packages...</div>
              ) : cards.length === 0 ? (
                <div className="text-sm text-muted-foreground">No packages available yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cards.map((p) => {
                    const tours = Array.isArray(p?.tours) ? p.tours : []
                    const cover1 = pickTourCover(tours?.[0])
                    const cover2 = pickTourCover(tours?.[1])

                    return (
                      <div
                        key={p?.id ?? `${p?.name}-${Math.random()}`}
                        className="rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition"
                      >
                        {/* Combined cover preview */}
                        <div className="h-44 bg-gray-100 relative overflow-hidden">
                          {cover1 && cover2 ? (
                            <div className="grid grid-cols-2 h-full w-full">
                              <img src={cover1} alt="" className="h-full w-full object-cover" />
                              <img src={cover2} alt="" className="h-full w-full object-cover" />
                            </div>
                          ) : cover1 ? (
                            <img src={cover1} alt={p?.name || "Package"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}

                          {/* subtle overlay */}
                          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {p?.name || "Untitled package"}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {p?.description || "—"}
                              </div>
                            </div>

                            <Badge variant="secondary" className="shrink-0">
                              {tours.length} tours
                            </Badge>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-900">
                              {peso(packageValue(p))}
                            </div>
                            <div className="text-xs text-muted-foreground">Total value</div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-50"
                              onClick={() => setActive(p)}
                            >
                              View details
                            </Button>

                            <Button
                              className="flex-1 bg-(--primary) text-white hover:brightness-95"
                              onClick={() => setActive(p)}
                            >
                              Book now
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DETAILS DIALOG */}
      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{active?.name || "Package"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {active?.description && (
              <p className="text-sm text-muted-foreground">{active.description}</p>
            )}

            <div className="text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Total package value</span>
              <span className="font-semibold">{peso(packageValue(active))}</span>
            </div>

            <div className="border rounded-lg overflow-auto max-h-[320px]">
              {(Array.isArray(active?.tours) ? active.tours : []).map((t) => (
                <div
                  key={t?.id ?? `${t?.title}-${Math.random()}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {t?.title || `Tour #${t?.id}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {peso(t?.price)}
                      {(t?.city || t?.country) && (
                        <span> • {[t.city, t.country].filter(Boolean).join(", ")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActive(null)
                        navigate(`/booking/${t.id}`)
                      }}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="bg-(--primary) text-white hover:opacity-90"
                      onClick={() => {
                        setActive(null)
                        navigate(`/booking/${t.id}`)
                      }}
                    >
                      Book
                    </Button>
                  </div>
                </div>
              ))}

              {(Array.isArray(active?.tours) ? active.tours : []).length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No tours in this package.</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}

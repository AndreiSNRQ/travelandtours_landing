import Header from "@/components/core1/header";
import FadeIn from "@/components/core1/fade-in";
import Footer from "@/components/core1/footer";
import wallpaperHeader from "@/assets/wallpaper-header-2.jpg";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import AuthContext from "@/context/AuthProvider";
import { toast } from "sonner";
import { getTourById, getTours } from "@/api/tours";
import { getItineraryByTour } from "@/api/itineraries";
import { createBooking } from "@/api/bookings";

const PER_PAGE = 9;

const inputBase =
  "w-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 rounded-md p-2 mt-1 outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary)";
const textareaBase =
  "w-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 rounded-md p-2 mt-1 outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary)";

// ---------- itinerary form ----------
const makeItinRow = () => ({
  day_number: "",
  title: "",
  description: "",
  start_time: "",
  end_time: "",
  location: "",
});

const initialBookingState = () => ({
  startDate: "",
  endDate: "",
  guests: 1,
  contactPhone: "",
  notes: "",
  wantsCustomItinerary: false,
  customItineraryText: "",
  customRows: [makeItinRow()],
});

// ---------- billing helpers ----------
const toNumber = (v) => {
  if (v == null) return 0;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (amount, currency = "PHP") => {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

export default function BookingPage() {
  const navigate = useNavigate();
  const { tourId } = useParams();
  const { auth, POST_LOGIN_REDIRECT_KEY } = useContext(AuthContext);

  const storageBase = import.meta.env.VITE_CT1_STORAGE_URL || "";

  const [tours, setTours] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasServerPagination, setHasServerPagination] = useState(false);

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("All");

  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState("");

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [booking, setBooking] = useState(initialBookingState);

  // ✅ prevent double submit + show UI state
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // -----------------------------
  // auth gate
  // -----------------------------
  const requireCustomerLogin = useCallback(() => {
    if (auth?.role === "Customer") return true;

    sessionStorage.setItem(
      POST_LOGIN_REDIRECT_KEY,
      window.location.pathname + window.location.search
    );
    toast.info("Please log in to continue.", { position: "top-center" });
    navigate("/login");
    return false;
  }, [auth?.role, POST_LOGIN_REDIRECT_KEY, navigate]);

  // -----------------------------
  // media helpers
  // -----------------------------
  const isAbsoluteUrl = (v = "") => /^https?:\/\//i.test(String(v).trim());
  const trimLeadingSlashes = (v = "") => String(v || "").replace(/^\/+/, "");

  const resolveMediaUrl = useCallback(
    (value) => {
      if (!value) return "";
      const v = String(value).trim();
      if (!v) return "";
      if (isAbsoluteUrl(v)) return v;

      if (v.startsWith("/storage/") || v.startsWith("storage/")) {
        const root = storageBase ? storageBase.replace(/\/storage\/?$/, "") : "";
        return root ? `${root}/${trimLeadingSlashes(v)}` : `/${trimLeadingSlashes(v)}`;
      }

      return storageBase ? `${storageBase}/${trimLeadingSlashes(v)}` : v;
    },
    [storageBase]
  );

  const parseArrayMaybe = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;

    if (typeof val === "string") {
      const s = val.trim();
      if (!s) return [];
      if (s.startsWith("[") || s.startsWith("{")) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
    return [];
  };

  const normalizeTour = useCallback(
    (t = {}) => {
      const rawImages =
        t.images ||
        t.gallery ||
        t.tour_images ||
        t.tourImages ||
        t.image_urls ||
        t.imageUrls ||
        [];

      const images = parseArrayMaybe(rawImages)
        .map((img) => {
          if (typeof img === "string") return resolveMediaUrl(img);
          if (img?.url) return resolveMediaUrl(img.url);
          if (img?.path) return resolveMediaUrl(img.path);
          if (img?.image) return resolveMediaUrl(img.image);
          return "";
        })
        .filter(Boolean);

      const image =
        resolveMediaUrl(t.image || t.thumbnail || t.cover || t.main_image || t.mainImage) ||
        images[0] ||
        "";

      return {
        id: t.id ?? t.tour_id ?? t.tourId,
        title: t.title || t.name || "Untitled Tour",
        description: t.description || t.short_description || t.shortDescription || "",
        fullDescription: t.full_description || t.fullDescription || "",
        location: t.location || t.destination || "",
        duration: t.duration || t.duration_days || t.days || "",
        groupSize: t.group_size || t.groupSize || "",
        rating: Number(t.rating || t.average_rating || t.avg_rating || 0) || 0,
        price: t.price ?? t.amount ?? t.cost ?? "",
        originalPrice: t.original_price ?? t.originalPrice ?? "",
        currency: t.currency || "PHP",
        highlights: parseArrayMaybe(t.highlights),
        inclusions: parseArrayMaybe(t.inclusions),
        exclusions: parseArrayMaybe(t.exclusions),
        itinerary: parseArrayMaybe(t.itinerary),
        images,
        image,
        raw: t,
      };
    },
    [resolveMediaUrl]
  );

  const renderStars = (rating = 0) => {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.round(r);
    return (
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < full ? "text-yellow-500" : "text-gray-300"}>
            ★
          </span>
        ))}
      </span>
    );
  };

  // -----------------------------
  // billing computed
  // -----------------------------
  const unitPrice = useMemo(() => toNumber(selectedTour?.price), [selectedTour?.price]);

  const pax = useMemo(() => {
    const g = Number(booking?.guests || 1);
    return Number.isFinite(g) && g > 0 ? g : 1;
  }, [booking?.guests]);

  const currency = selectedTour?.currency || "PHP";
  const subtotal = useMemo(() => unitPrice * pax, [unitPrice, pax]);

  // -----------------------------
  // load tours
  // -----------------------------
  const loadTours = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        setLoadError("");

        const apiResponse = await getTours({
          page,
          per_page: PER_PAGE,
          limit: PER_PAGE,
        });

        const data = Array.isArray(apiResponse)
          ? apiResponse
          : apiResponse?.data?.data || apiResponse?.data || apiResponse?.tours || [];

        const meta = Array.isArray(apiResponse) ? null : apiResponse?.meta || apiResponse;
        const lastPage = meta?.last_page || meta?.lastPage || meta?.pagination?.last_page;
        const hasPagination = Boolean(lastPage);

        setHasServerPagination(hasPagination);

        const normalized = Array.isArray(data) ? data.map(normalizeTour) : [];
        setTours(normalized);

        setTotalPages(
          hasPagination ? Number(lastPage) : Math.max(1, Math.ceil(normalized.length / PER_PAGE))
        );
      } catch (err) {
        console.error("Failed to load tours", err);
        setLoadError("Failed to load tours. Please try again.");
        setTours([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [normalizeTour]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      await loadTours(currentPage);
    })();
    return () => {
      active = false;
    };
  }, [currentPage, loadTours]);

  const openDetails = useCallback((tour) => {
    setSelectedTour(tour);
    setSelectedImage(0);
    setActiveTab("overview");
    setItineraryError("");
    setBooking(initialBookingState());
    setIsBookingOpen(false);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      if (!tourId) {
        setSelectedTour(null);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError("");

        const res = await getTourById(tourId);
        const raw = res?.data ?? res?.tour ?? res;
        const normalized = normalizeTour(raw);

        if (!active) return;
        openDetails(normalized);
      } catch (err) {
        const found = tours.find((t) => String(t.id) === String(tourId));
        if (found) {
          if (!active) return;
          openDetails(found);
        } else {
          if (!active) return;
          setLoadError("Package not found.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [tourId, tours, normalizeTour, openDetails]);

  const handleBackToList = useCallback(() => {
    setSelectedTour(null);
    setSelectedImage(0);
    setActiveTab("overview");
    setItineraryError("");
    setIsBookingOpen(false);
    navigate("/booking");
  }, [navigate]);

  // load itinerary
  useEffect(() => {
    let isActive = true;

    (async () => {
      if (!selectedTour?.id) return;

      try {
        setItineraryLoading(true);
        setItineraryError("");

        const items = await getItineraryByTour(selectedTour.id);

        if (!isActive) return;

        if (Array.isArray(items) && items.length) {
          const normalized = items.map((i, idx) => ({
            day: i.day_number ?? idx + 1,
            title: i.title || `Day ${i.day_number ?? idx + 1}`,
            activities: i.description ? [i.description] : [],
            time: { start: i.start_time, end: i.end_time },
            location: i.location,
          }));
          setSelectedTour((prev) => ({ ...prev, itinerary: normalized }));
        } else {
          setSelectedTour((prev) => ({ ...prev, itinerary: [] }));
        }
      } catch (err) {
        console.error("Failed to load itinerary", err);
        if (!isActive) return;
        setItineraryError("Failed to load itinerary.");
      } finally {
        if (isActive) setItineraryLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [selectedTour?.id]);

  // -----------------------------
  // filtering + paging
  // -----------------------------
  const filteredTours = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tours.filter((tour) => {
      const hay = `${tour?.title || ""} ${tour?.description || ""} ${tour?.location || ""}`.toLowerCase();
      const matchesQuery = !q ? true : hay.includes(q);

      const matchesLocation =
        location === "All"
          ? true
          : String(tour?.location || "").toLowerCase().includes(location.toLowerCase());

      return matchesQuery && matchesLocation;
    });
  }, [tours, query, location]);

  const pagedTours = useMemo(() => {
    if (hasServerPagination) return filteredTours;
    return filteredTours.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  }, [filteredTours, currentPage, hasServerPagination]);

  const handleViewDetails = (tour) => {
    if (!tour?.id) return;
    navigate(`/booking/${tour.id}`);
  };

  // -----------------------------
  // modal open
  // -----------------------------
  const openBookingModal = () => {
    if (!requireCustomerLogin()) return;
    setIsBookingOpen(true);
  };

  // -----------------------------
  // booking form handlers
  // -----------------------------
  const updateBooking = (key, value) => setBooking((prev) => ({ ...prev, [key]: value }));

  const addCustomRow = () => {
    setBooking((prev) => ({
      ...prev,
      customRows: [...(prev.customRows || []), makeItinRow()],
    }));
  };

  const removeCustomRow = (index) => {
    setBooking((prev) => {
      const copy = [...(prev.customRows || [])];
      copy.splice(index, 1);
      return { ...prev, customRows: copy.length ? copy : [makeItinRow()] };
    });
  };

  const updateCustomRowField = (index, key, value) => {
    setBooking((prev) => {
      const copy = [...(prev.customRows || [])];
      copy[index] = { ...copy[index], [key]: value };
      return { ...prev, customRows: copy };
    });
  };

  /**
   * ✅ Allow duplicate day_number.
   * We'll still validate required fields.
   */
  const buildItineraryRows = () => {
    if (!selectedTour?.id) return [];

    const rows = (booking.customRows || [])
      .map((r) => {
        const dayNum = String(r.day_number || "").trim();
        const day_number = dayNum ? Number(dayNum) : NaN;

        const title = (r.title || "").trim();
        const description =
          (r.description || "").trim() || (booking.customItineraryText || "").trim();

        if (!Number.isFinite(day_number)) return null;
        if (!description) return null;

        return {
          tour_id: selectedTour.id,
          day_number,
          title: title || `Day ${day_number}`,
          description,
          sort_order: day_number,
          start_time: r.start_time || null,
          end_time: r.end_time || null,
          location: (r.location || "").trim() || selectedTour.location || null,
        };
      })
      .filter(Boolean);

    rows.sort((a, b) => {
      if (a.day_number !== b.day_number) return a.day_number - b.day_number;
      const sa = a.start_time || "";
      const sb = b.start_time || "";
      return sa.localeCompare(sb);
    });

    return rows;
  };

  const submitBooking = async () => {
    if (!requireCustomerLogin()) return;
    if (submittingBooking) return;

    if (!selectedTour?.id) return toast.error("Missing package.", { position: "top-center" });
    if (!booking.startDate)
      return toast.error("Please select a start date.", { position: "top-center" });
    if (!booking.endDate)
      return toast.error("Please select an end date.", { position: "top-center" });
    if (!booking.contactPhone.trim())
      return toast.error("Please enter your contact number.", { position: "top-center" });
    if (Number(booking.guests) < 1)
      return toast.error("Guests must be at least 1.", { position: "top-center" });

    const itineraryRows = booking.wantsCustomItinerary ? buildItineraryRows() : [];

    if (booking.wantsCustomItinerary) {
      const missingDay = (booking.customRows || []).some((r) => !String(r.day_number || "").trim());
      if (missingDay) {
        return toast.error("Please input Day number for all itinerary rows.", {
          position: "top-center",
        });
      }

      if (itineraryRows.length === 0) {
        return toast.error("Custom itinerary rows are empty. Add a description.", {
          position: "top-center",
        });
      }
    }

    const payload = {
      tour_id: selectedTour.id,
      start_date: booking.startDate,
      end_date: booking.endDate,
      guests: Number(booking.guests),
      contact_phone: booking.contactPhone.trim(),
      notes: booking.notes.trim(),

      billing: {
        unit_price: unitPrice,
        pax,
        subtotal,
        currency,
      },

      customer: {
        id: auth?.id ?? null,
        name: auth?.name ?? null,
        email: auth?.email ?? null,
        role: auth?.role ?? null,
      },

      wants_custom_itinerary: Boolean(booking.wantsCustomItinerary),
      custom_itinerary_text: booking.customItineraryText.trim(),
      itinerary_rows: itineraryRows,
    };

    setSubmittingBooking(true);

    try {
      const res = await createBooking(payload);

      // ✅ Some backends return escaped slashes: https:\/\/checkout...
      const checkoutUrlRaw = res?.checkout_url || "";
      const checkoutUrl = String(checkoutUrlRaw).replace(/\\\//g, "/").trim();

      // close modal & reset state (booking is already saved)
      setIsBookingOpen(false);
      setBooking(initialBookingState());

      if (checkoutUrl) {
        toast.success("Booking created ✅ Redirecting to payment...", { position: "top-center" });

        // ✅ Redirect to PayMongo hosted checkout
        window.location.assign(checkoutUrl);
        return;
      }

      // fallback: booking created but no link
      toast.success("Booking created ✅", { position: "top-center" });
      toast.info("Payment link was not generated. Please try again.", { position: "top-center" });
      console.log("BOOKING RESPONSE:", res);
    } catch (err) {
      console.error("Submit booking failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to submit booking. Please try again.";
      toast.error(msg, { position: "top-center" });
    } finally {
      setSubmittingBooking(false);
    }
  };


  // -----------------------------
  // DETAILS VIEW
  // -----------------------------
  if (selectedTour) {
    const hero = selectedTour.images?.[selectedImage] || selectedTour.image;

    return (
      <div className="flex justify-center">
        <div className="max-w-[1920px] w-full">
          <Header />

          <div className="p-4 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={handleBackToList}>
              ← Back to Tours
            </Button>

            <Button className="bg-(--primary) text-white hover:opacity-90" onClick={openBookingModal}>
              Book this package
            </Button>
          </div>

          <div className="relative h-[400px] overflow-hidden">
            {hero ? (
              <img
                src={hero}
                alt={selectedTour.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-black/10" />
            )}

            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute bottom-8 left-8 text-white">
              <FadeIn>
                <h1 className="text-4xl font-bold mb-2">{selectedTour.title}</h1>
                <p className="text-xl">{selectedTour.location}</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center mr-4">{renderStars(selectedTour.rating || 0)}</div>
                  <Badge variant="secondary" className="bg-white text-black">
                    {selectedTour.duration || "—"}
                  </Badge>
                </div>
              </FadeIn>
            </div>
          </div>

          {selectedTour.images?.length > 0 && (
            <div className="p-8">
              <FadeIn>
                <h2 className="text-2xl font-bold mb-4">Photo Gallery</h2>
                <Carousel className="w-full max-w-4xl mx-auto">
                  <CarouselContent>
                    {selectedTour.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <Card className="overflow-hidden">
                            <img
                              src={image}
                              alt={`${selectedTour.title} - Image ${index + 1}`}
                              className="w-full h-64 object-cover cursor-pointer"
                              onClick={() => setSelectedImage(index)}
                            />
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </FadeIn>
            </div>
          )}

          <div className="px-8 pb-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT */}
                <div className="lg:col-span-2">
                  <div className="flex border-b mb-6">
                    {["overview", "itinerary", "reviews"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-medium capitalize ${
                          activeTab === tab
                            ? "border-b-2 border-(--primary) text-(--primary)"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {activeTab === "overview" && (
                    <FadeIn>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-bold mb-3">About This Tour</h3>
                          <p className="text-gray-700 leading-relaxed">
                            {selectedTour.fullDescription || selectedTour.description}
                          </p>
                        </div>
                      </div>
                    </FadeIn>
                  )}

                  {activeTab === "itinerary" && (
                    <FadeIn>
                      <div className="space-y-6">
                        {itineraryLoading && (
                          <p className="text-sm text-muted-foreground">Loading itinerary...</p>
                        )}
                        {itineraryError && <p className="text-sm text-red-500">{itineraryError}</p>}

                        {(selectedTour.itinerary || []).length === 0 &&
                          !itineraryLoading &&
                          !itineraryError && (
                            <p className="text-sm text-muted-foreground">
                              No itinerary has been added for this tour yet.
                            </p>
                          )}

                        {(selectedTour.itinerary || []).map((day, index) => (
                          <Card key={index} className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-(--primary) text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                                {day.day}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold mb-2">{day.title}</h3>
                                <div className="mb-3">
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    {(day.activities || []).map((activity, actIndex) => (
                                      <li key={actIndex}>{activity}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </FadeIn>
                  )}

                  {activeTab === "reviews" && (
                    <FadeIn>
                      <div className="space-y-6">
                        <p className="text-sm text-muted-foreground">
                          Reviews section can be wired to your backend later.
                        </p>
                        <Separator />
                      </div>
                    </FadeIn>
                  )}
                </div>

                {/* RIGHT */}
                <div className="lg:col-span-1">
                  <FadeIn>
                    <Card className="p-6 sticky top-8 bg-white">
                      <h3 className="text-lg font-bold mb-2">Ready to book?</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Open the booking form in a modal and submit your details.
                      </p>
                      <Button
                        className="w-full bg-(--primary) text-white hover:opacity-90"
                        onClick={openBookingModal}
                      >
                        Open Booking Form
                      </Button>
                    </Card>
                  </FadeIn>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ BOOKING MODAL */}
          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogContent
              className="
                w-[95vw]
                sm:w-auto
                sm:max-w-[980px]
                lg:max-w-[1100px]
                xl:max-w-[1200px]
                max-h-[85vh]
                overflow-y-auto
                bg-white
                text-gray-900
                border border-gray-200
                p-0
              "
            >
              <div className="px-6 pt-6">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">Booking Form</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Package:{" "}
                    <span className="font-semibold text-gray-900">{selectedTour.title}</span>
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">Start Date</label>
                    <input
                      type="date"
                      value={booking.startDate}
                      onChange={(e) => updateBooking("startDate", e.target.value)}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-900">End Date</label>
                    <input
                      type="date"
                      value={booking.endDate}
                      onChange={(e) => updateBooking("endDate", e.target.value)}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-900">Guests</label>
                    <input
                      type="number"
                      min="1"
                      value={booking.guests}
                      onChange={(e) =>
                        updateBooking("guests", Math.max(1, Number(e.target.value || 1)))
                      }
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-900">Contact Number</label>
                    <input
                      type="text"
                      value={booking.contactPhone}
                      onChange={(e) => updateBooking("contactPhone", e.target.value)}
                      placeholder="09xx xxx xxxx"
                      className={inputBase}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-900">Notes (optional)</label>
                    <textarea
                      value={booking.notes}
                      onChange={(e) => updateBooking("notes", e.target.value)}
                      placeholder="Pick-up location, special requests..."
                      className={`${textareaBase} min-h-[90px]`}
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex items-center gap-2">
                  <input
                    id="customItin"
                    type="checkbox"
                    checked={booking.wantsCustomItinerary}
                    onChange={(e) => updateBooking("wantsCustomItinerary", e.target.checked)}
                  />
                  <label htmlFor="customItin" className="text-sm font-semibold text-gray-900">
                    I want a custom itinerary
                  </label>
                </div>

                {booking.wantsCustomItinerary && (
                  <div className="mt-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-900">
                        General custom itinerary notes (optional)
                      </label>
                      <textarea
                        value={booking.customItineraryText}
                        onChange={(e) => updateBooking("customItineraryText", e.target.value)}
                        placeholder="Example: I prefer a relaxed schedule, seafood dinner, and sunrise view..."
                        className={`${textareaBase} min-h-[90px]`}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Itinerary Rows (allow multiple rows per Day)
                      </p>

                      <Button type="button" variant="outline" onClick={addCustomRow} className="h-9">
                        + Add itinerary row
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {(booking.customRows || []).map((r, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                            <div className="flex flex-wrap items-end gap-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-700">Day #</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={r.day_number}
                                  onChange={(e) =>
                                    updateCustomRowField(idx, "day_number", e.target.value)
                                  }
                                  className="w-[120px] border border-gray-300 bg-white text-gray-900 rounded-md p-2 mt-1 outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary)"
                                  placeholder="1"
                                />
                              </div>
                              <span className="text-xs text-gray-500 pb-2">(duplicates allowed)</span>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => removeCustomRow(idx)}
                              className="h-9"
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="md:col-span-2">
                              <label className="text-sm font-semibold text-gray-900">Title</label>
                              <input
                                type="text"
                                value={r.title}
                                onChange={(e) => updateCustomRowField(idx, "title", e.target.value)}
                                placeholder="e.g., Island hopping"
                                className={inputBase}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="text-sm font-semibold text-gray-900">
                                Description
                              </label>
                              <textarea
                                value={r.description}
                                onChange={(e) =>
                                  updateCustomRowField(idx, "description", e.target.value)
                                }
                                placeholder="What will you do on this schedule?"
                                className={`${textareaBase} min-h-[80px]`}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-semibold text-gray-900">Start time</label>
                              <input
                                type="time"
                                value={r.start_time}
                                onChange={(e) =>
                                  updateCustomRowField(idx, "start_time", e.target.value)
                                }
                                className={inputBase}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-semibold text-gray-900">End time</label>
                              <input
                                type="time"
                                value={r.end_time}
                                onChange={(e) =>
                                  updateCustomRowField(idx, "end_time", e.target.value)
                                }
                                className={inputBase}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="text-sm font-semibold text-gray-900">Location</label>
                              <input
                                type="text"
                                value={r.location}
                                onChange={(e) =>
                                  updateCustomRowField(idx, "location", e.target.value)
                                }
                                placeholder={selectedTour.location || "Location"}
                                className={inputBase}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Billing Summary */}
                <Separator className="my-5" />
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Billing Summary</h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Package price</span>
                      <span className="font-medium text-gray-900">
                        {unitPrice ? formatMoney(unitPrice, currency) : "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Guests (pax)</span>
                      <span className="font-medium text-gray-900">{pax}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-900 font-semibold">Subtotal</span>
                      <span className="text-gray-900 font-bold">
                        {unitPrice ? formatMoney(subtotal, currency) : "—"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mt-3">
                    Subtotal is computed as pax × package price. Final total may change after confirmation.
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsBookingOpen(false)} disabled={submittingBooking}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-(--primary) text-white hover:opacity-90"
                    onClick={submitBooking}
                    disabled={submittingBooking}
                  >
                    {submittingBooking ? "Submitting..." : "Submit Booking"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          <Footer />
        </div>
      </div>
    );
  }

  // -----------------------------
  // LIST VIEW
  // -----------------------------
  return (
    <>
      <div className="relative overflow-hidden">
        <img
          src={wallpaperHeader}
          alt="wallpaper"
          className="absolute inset-0 w-full h-full object-cover -z-10 blur-[2px]"
        />
        <div className="relative z-10">
          <Header />

          <div className="p-60 px-10 flex justify-center">
            <FadeIn>
              <h1 className="text-white text-[40px] text-center font-bold">
                Your Gateway to Endless
              </h1>
              <p className="text-(--vivid-neon-pink) lg:text-[60px] text-center font-bold leading-tight text-[40px]">
                Adventures.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>

      <FadeIn className="p-8 rounded-lg bg-white w-full flex flex-col" id="destinations">
        <div className="flex justify-center">
          <div className="w-full max-w-[1200px]">
            <h1 className="text-2xl font-bold mb-4">Choose your tour</h1>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tours (e.g., Boracay, river, sunset)"
                className="border rounded-md p-3 w-full sm:w-[60%]"
              />

              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border rounded-md p-3 w-full sm:w-[40%]"
              >
                <option value="All">All locations</option>
                <option value="Palawan">Palawan</option>
                <option value="Boracay">Boracay</option>
                <option value="Bohol">Bohol</option>
              </select>
            </div>

            {isLoading && <p className="text-sm text-muted-foreground mb-4">Loading tours...</p>}
            {loadError && <p className="text-sm text-red-500 mb-2">{loadError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedTours.map((tour) => (
                <Card key={tour.id} className="relative overflow-hidden p-0 h-full flex flex-col">
                  <div className="h-48 w-full relative bg-black/10">
                    {tour.image ? (
                      <img
                        src={tour.image}
                        alt={tour.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <CardContent className="p-4 flex flex-col flex-1">
                    <p className="font-bold">{tour.title}</p>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {tour.description}
                    </p>

                    <div className="flex items-center gap-2 mt-auto">
                      <Button variant="outline" onClick={() => handleViewDetails(tour)}>
                        View details
                      </Button>

                      <Button
                        className="bg-(--primary) text-white hover:opacity-90"
                        onClick={() => {
                          if (!requireCustomerLogin()) return;
                          navigate(`/booking/${tour.id}`);
                          toast.info("Open booking form and submit.", { position: "top-center" });
                        }}
                      >
                        Book now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTours.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground mt-3">No tours match your search.</p>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      currentPage === pageNum
                        ? "bg-(--primary) text-white border-(--primary)"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      <Footer />
    </>
  );
}

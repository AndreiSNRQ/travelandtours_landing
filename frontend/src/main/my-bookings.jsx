import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import axios from "axios";

import Header from "@/components/core1/header";
import Footer from "@/components/core1/footer";
import AuthContext from "@/context/AuthProvider";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { getMyBookings } from "@/api/bookings";

function safeStr(v) {
  return v == null ? "" : String(v);
}

function formatDate(d) {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return safeStr(d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return safeStr(d);
  }
}

function formatMoney(amount, currency = "PHP") {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${safeStr(amount)} ${currency}`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

function statusBadgeVariant(status) {
  const s = safeStr(status).toLowerCase();
  if (s === "approved") return "default";
  if (s === "rejected") return "destructive";
  if (s === "pending") return "secondary";
  return "outline";
}

function paymentBadgeVariant(paymentStatus) {
  const s = safeStr(paymentStatus).toLowerCase();
  if (s === "paid") return "default";
  if (s === "authorized") return "secondary";
  if (s === "failed") return "destructive";
  if (s === "unpaid") return "secondary";
  return "outline";
}

function PaymentBadge({ payment_status }) {
  const label = safeStr(payment_status || "unpaid").toUpperCase();
  return <Badge variant={paymentBadgeVariant(payment_status)}>{label}</Badge>;
}

function StatusBadge({ status }) {
  const label = safeStr(status || "pending").toUpperCase();
  return <Badge variant={statusBadgeVariant(status)}>{label}</Badge>;
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="text-xs text-gray-500 whitespace-nowrap">{label}</div>
      <div className="text-sm text-gray-900 text-right break-words">{value}</div>
    </div>
  );
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto w-[92%] max-w-2xl">
        <Card className="shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="text-lg font-semibold text-gray-900">{title}</div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
            <Separator className="my-4" />
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl ${n <= value ? "text-yellow-400" : "text-gray-300"}`}
          aria-label={`Rate ${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { auth, loading, POST_LOGIN_REDIRECT_KEY } = useContext(AuthContext);

  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(false);

  const [selected, setSelected] = useState(null);

  // rating modal state
  const [rateOpen, setRateOpen] = useState(false);
  const [rateTarget, setRateTarget] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const identity = useMemo(() => {
    const email =
      auth?.email ||
      auth?.user?.email ||
      auth?.data?.email ||
      auth?.customer?.email ||
      "";

    const phone =
      auth?.phone ||
      auth?.contact_phone ||
      auth?.mobile ||
      auth?.user?.phone ||
      auth?.user?.contact_phone ||
      auth?.data?.phone ||
      auth?.customer?.phone ||
      "";

    return {
      email: safeStr(email).trim(),
      phone: safeStr(phone).trim(),
    };
  }, [auth]);

  const requireCustomerLogin = () => {
    if (auth?.role === "Customer") return true;

    sessionStorage.setItem(
      POST_LOGIN_REDIRECT_KEY,
      window.location.pathname + window.location.search
    );

    toast.info("Please log in to continue.", { position: "top-center" });
    navigate("/login");
    return false;
  };

  const load = async () => {
    if (!requireCustomerLogin()) return;

    if (!identity.email && !identity.phone) {
      toast.error("Missing email/phone in your account. Please re-login or update profile.", {
        position: "top-center",
      });
      navigate("/login");
      return;
    }

    setFetching(true);
    try {
      const data = await getMyBookings(auth);
      const list = Array.isArray(data) ? data : data?.data || [];
      setItems(list);
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to load bookings.";
      toast.error(msg, { position: "top-center" });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  /**
   * ✅ rating rule:
   * Only allow rate when booking is approved AND paid.
   * If you want "approved only", change this to: status === "approved"
   */
  const canRate = (b) => {
    const status = safeStr(b?.status).toLowerCase();
    const pay = safeStr(b?.payment_status).toLowerCase();
    return status === "approved" && pay === "paid";
  };

  const openRate = (b) => {
    setRateTarget(b);
    setRatingValue(5);
    setRatingComment("");
    setRateOpen(true);
  };

  const closeRate = () => {
    setRateOpen(false);
    setRateTarget(null);
  };

  /**
   * ✅ submit rating without touching src/api/bookings.js
   * POST bookingtocbs /api/my-bookings/{id}/rate
   */
  const submitRating = async () => {
    if (!rateTarget?.id) return;

    const rating = Number(ratingValue);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      toast.error("Rating must be between 1 and 5.", { position: "top-center" });
      return;
    }

    const backend = import.meta.env.VITE_CT1_BACKEND;
    const apiKey = import.meta.env.VITE_JOLI_API_KEY;

    // ✅ quick debug (remove later)
    console.log("RATE HEADERS DEBUG", {
      backend,
      apiKey_present: !!apiKey,
      email: identity.email,
      phone: identity.phone,
    });

    if (!backend) {
      toast.error("Missing VITE_CT1_BACKEND in .env", { position: "top-center" });
      return;
    }
    if (!apiKey) {
      toast.error("Missing VITE_JOLI_API_KEY in .env", { position: "top-center" });
      return;
    }
    if (!identity.email && !identity.phone) {
      toast.error("Missing email/phone identity. Please re-login.", { position: "top-center" });
      return;
    }

    // ✅ IMPORTANT: always send at least ONE identifier
    const customerHeaders = identity.email
      ? { "X-CUSTOMER-EMAIL": String(identity.email).trim() }
      : { "X-CUSTOMER-PHONE": String(identity.phone).trim() };

    setRatingSubmitting(true);
    try {
      await axios.post(
        `${backend}/api/my-bookings/${rateTarget.id}/rate`,
        { rating, comment: ratingComment },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",

            // required by bookingtocbs middleware
            "X-JOLI-API-KEY": String(apiKey).trim(),
            ...customerHeaders,
          },
        }
      );

      toast.success("Thanks! Your rating was submitted.", { position: "top-center" });
      closeRate();
      load();
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to submit rating.";
      toast.error(msg, { position: "top-center" });
    } finally {
      setRatingSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-sm text-gray-600">
              View your booking status, dates, and payment info.
            </p>
          </div>

          <Button variant="outline" onClick={load} disabled={fetching}>
            {fetching ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <Separator className="my-4" />

        {fetching ? (
          <div className="text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600">No bookings found.</div>
        ) : (
          <div className="grid gap-4">
            {items.map((b) => {
              const tourTitle =
                b?.tour_title ||
                b?.tour?.title ||
                b?.tour?.name ||
                b?.tour_name ||
                b?.destination ||
                "Tour";

              const dateRange =
                b?.start_date && b?.end_date
                  ? `${formatDate(b.start_date)} → ${formatDate(b.end_date)}`
                  : formatDate(b?.start_date || b?.end_date);

              const subtotal = formatMoney(
                b?.subtotal ?? b?.unit_price ?? 0,
                b?.currency || "PHP"
              );

              return (
                <Card key={b.id} className="bg-white">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-lg font-semibold text-gray-900 truncate">
                          {tourTitle}
                        </div>
                        <div className="text-sm text-gray-600">
                          Booking ID: <span className="font-medium">{b.id}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={b.status} />
                        <PaymentBadge payment_status={b.payment_status} />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-gray-500 mb-2">Trip Details</div>
                        <DetailRow label="Dates" value={dateRange || "-"} />
                        <DetailRow label="Guests" value={safeStr(b?.guests || "-")} />
                        <DetailRow label="Contact" value={safeStr(b?.contact_phone || "-")} />
                      </div>

                      <div className="rounded-md border p-3">
                        <div className="text-xs text-gray-500 mb-2">Payment</div>
                        <DetailRow label="Total" value={subtotal} />
                        <DetailRow label="Currency" value={safeStr(b?.currency || "PHP")} />
                        <DetailRow label="Provider" value={safeStr(b?.payment_provider || "-")} />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                      <Button variant="outline" onClick={() => setSelected(b)}>
                        View details
                      </Button>

                      {safeStr(b?.payment_status).toLowerCase() !== "paid" && b?.payment_url ? (
                        <Button onClick={() => window.open(b.payment_url, "_blank")}>
                          Pay Now
                        </Button>
                      ) : null}

                      {/* ✅ Rate is back */}
                      {canRate(b) ? (
                        <Button onClick={() => openRate(b)}>
                          Rate
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        open={!!selected}
        title={selected ? `Booking #${selected.id}` : ""}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-gray-500 mb-2">Customer</div>
              <DetailRow label="Name" value={safeStr(selected?.customer_name || "-")} />
              <DetailRow label="Email" value={safeStr(selected?.customer_email || "-")} />
              <DetailRow label="Phone" value={safeStr(selected?.contact_phone || "-")} />
            </div>

            <div className="rounded-md border p-3">
              <div className="text-xs text-gray-500 mb-2">Status</div>
              <DetailRow label="Booking" value={safeStr(selected?.status || "-")} />
              <DetailRow label="Payment" value={safeStr(selected?.payment_status || "-")} />
              <DetailRow label="Paid At" value={formatDate(selected?.paid_at) || "-"} />
            </div>

            <div className="rounded-md border p-3 sm:col-span-2">
              <div className="text-xs text-gray-500 mb-2">Trip</div>
              <DetailRow label="Start" value={formatDate(selected?.start_date)} />
              <DetailRow label="End" value={formatDate(selected?.end_date)} />
              <DetailRow label="Guests" value={safeStr(selected?.guests || "-")} />
            </div>

            <div className="rounded-md border p-3 sm:col-span-2">
              <div className="text-xs text-gray-500 mb-2">Payment Details</div>
              <DetailRow
                label="Total"
                value={formatMoney(
                  selected?.subtotal ?? selected?.unit_price ?? 0,
                  selected?.currency || "PHP"
                )}
              />
              <DetailRow label="Reference" value={safeStr(selected?.payment_reference || "-")} />
              <DetailRow label="Checkout ID" value={safeStr(selected?.paymongo_checkout_id || "-")} />
              <DetailRow label="URL" value={selected?.payment_url ? "Available" : "-"} />
            </div>

            {selected?.notes ? (
              <div className="rounded-md border p-3 sm:col-span-2">
                <div className="text-xs text-gray-500 mb-2">Notes</div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">{selected.notes}</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* Rating Modal */}
      <Modal
        open={rateOpen}
        title={rateTarget ? `Rate Booking #${rateTarget.id}` : "Rate Booking"}
        onClose={closeRate}
      >
        {rateTarget ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">Your rating</div>
              <StarPicker value={ratingValue} onChange={setRatingValue} />
            </div>

            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">Comment (optional)</div>
              <Textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeRate} disabled={ratingSubmitting}>
                Cancel
              </Button>
              <Button onClick={submitRating} disabled={ratingSubmitting}>
                {ratingSubmitting ? "Submitting..." : "Submit Rating"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Footer />
    </div>
  );
}

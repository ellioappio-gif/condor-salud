"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/lib/i18n/context";

// ─── Types ───────────────────────────────────────────────────

interface ReviewForModeration {
  id: string;
  doctorProfileId: string;
  patientDisplayName: string;
  rating: number;
  title?: string;
  body?: string;
  isVerifiedPatient: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  doctor?: {
    displayName: string;
    slug: string;
    specialty: string;
  };
}

// ─── Page ────────────────────────────────────────────────────

export default function ReviewModerationPage() {
  const { t } = useLocale();
  const [reviews, setReviews] = useState<ReviewForModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      // Silent fail — show empty
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleAction = async (reviewId: string, action: "approve" | "reject") => {
    setActionLoading(reviewId);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action }),
      });
      if (res.ok) {
        // Remove from list
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Stars renderer ────────────────────────────────────────
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "text-[#F6B40E]" : "text-gray-300"} aria-hidden="true">
        *
      </span>
    ));
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8" role="main">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-[#1A1A1A]">{t("reviews.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestione las reseñas de pacientes antes de que aparezcan públicamente.
        </p>
      </header>

      {/* Filter tabs */}
      <nav aria-label="Review status filter" className="mb-6 flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === s
                ? "bg-[#75AADB] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-pressed={filter === s}
          >
            {t(`reviews.${s}`)}
          </button>
        ))}
      </nav>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-[#75AADB] border-t-transparent"
            role="status"
            aria-label="Loading"
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && reviews.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-lg text-gray-400">{t("reviews.noItems")}</p>
        </div>
      )}

      {/* Review cards */}
      {!loading && reviews.length > 0 && (
        <ul className="space-y-4" role="list" aria-label="Reviews to moderate">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: review content */}
                <div className="min-w-0 flex-1">
                  {/* Doctor info */}
                  {review.doctor && (
                    <p className="mb-1 text-xs text-gray-400">
                      Para:{" "}
                      <span className="font-medium text-gray-600">{review.doctor.displayName}</span>
                      {" · "}
                      {review.doctor.specialty}
                    </p>
                  )}

                  {/* Rating + patient */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-label={`${review.rating} de 5 estrellas`}>
                      {renderStars(review.rating)}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {review.patientDisplayName}
                    </span>
                    {review.isVerifiedPatient && (
                      <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                        VERIFICADO
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  {review.title && (
                    <h3 className="mt-2 font-semibold text-gray-900">{review.title}</h3>
                  )}

                  {/* Body */}
                  {review.body && (
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{review.body}</p>
                  )}

                  {/* Date */}
                  <time className="mt-2 block text-xs text-gray-400" dateTime={review.createdAt}>
                    {new Date(review.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>

                {/* Right: actions */}
                {filter === "pending" && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleAction(review.id, "approve")}
                      disabled={actionLoading === review.id}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                      aria-label={`Aprobar reseña de ${review.patientDisplayName}`}
                    >
                      {t("reviews.approve")}
                    </button>
                    <button
                      onClick={() => handleAction(review.id, "reject")}
                      disabled={actionLoading === review.id}
                      className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      aria-label={`Rechazar reseña de ${review.patientDisplayName}`}
                    >
                      {t("reviews.reject")}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

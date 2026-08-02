"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/app/lib/api";
import Button from "@/app/components/ui/Button";
import Badge from "@/app/components/ui/Badge";
import { useLanguage } from "@/app/context/LanguageContext";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userId: string;
  productId: string;
  userFirstName?: string;
  userLastName?: string;
}

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/products/${productId}/reviews`);
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const hasUserReviewed = user && reviews.some((r) => r.userId === user.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t("reviews.rating_required_error"));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const res = await api.post(`/api/v1/products/${productId}/reviews`, {
        rating,
        comment: comment.trim() || undefined,
      });

      if (res.success) {
        setSuccess(true);
        setRating(0);
        setComment("");
        // Reload reviews locally
        await fetchReviews();
        // Refresh RSC page to update global product rating
        router.refresh();
      } else {
        setError(res.error || t("reviews.submit_error"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("reviews.submit_error");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16 pt-12 border-t border-border/60">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Side: Summary & Form */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary uppercase tracking-tight">
              {t("reviews.section_title")}
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              {t("reviews.section_desc")}
            </p>
          </div>

          {/* Review Form Block */}
          <div className="bg-bg-surface border border-border p-6 rounded-none space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-text-primary">
              {t("reviews.rate_title")}
            </h3>

            {!isAuthenticated ? (
              <div className="text-xs text-text-secondary space-y-3">
                <p>{t("reviews.login_required")}</p>
                <Button href={`/login?redirect=/catalogo/${productId}`} variant="outline" size="sm" className="w-full text-center">
                  {t("reviews.login_btn")}
                </Button>
              </div>
            ) : hasUserReviewed ? (
              <div className="space-y-2">
                <Badge variant="success" className="w-full justify-center py-1 text-xs">
                  {t("reviews.already_reviewed_badge")}
                </Badge>
                <p className="text-xs text-text-secondary text-center leading-relaxed">
                  {t("reviews.already_reviewed_desc")}
                </p>
              </div>
            ) : success ? (
              <div className="bg-success/5 border border-success/20 p-4 text-center space-y-2">
                <p className="text-xs font-bold text-success">{t("reviews.success_title")}</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {t("reviews.success_desc")}
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider mt-2 cursor-pointer"
                >
                  {t("reviews.write_another")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-text-secondary block">
                    {t("reviews.rating_label")}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-2xl transition-transform duration-100 hover:scale-110 focus:outline-none cursor-pointer"
                      >
                        <svg
                          className={`h-7 w-7 ${
                            star <= (hoverRating || rating)
                              ? "text-amber-500"
                              : "text-zinc-300 dark:text-zinc-700 hover:text-amber-400"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Input */}
                <div className="space-y-1.5">
                  <label htmlFor="comment" className="text-[10px] uppercase tracking-wider font-bold text-text-secondary block">
                    {t("reviews.comment_label")}
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("reviews.comment_placeholder")}
                    rows={3}
                    maxLength={500}
                    className="w-full bg-bg-base border border-border px-3 py-2 text-xs text-text-primary rounded-none focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-text-muted"
                  />
                  <div className="text-right text-[10px] text-text-muted">
                    {comment.length}/500
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-error font-semibold leading-relaxed bg-error/5 border border-error/10 p-2.5">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full uppercase tracking-wider text-xs font-bold py-2.5"
                >
                  {submitting ? t("reviews.submitting") : t("reviews.submit_btn")}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: List of Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs uppercase tracking-wider font-extrabold text-text-primary">
            {t("reviews.reviews_count")} ({reviews.length})
          </h3>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border border-border p-4 bg-bg-surface space-y-3 animate-pulse">
                  <div className="h-4 bg-bg-surface-light w-1/4" />
                  <div className="h-4 bg-bg-surface-light w-3/4" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 bg-bg-surface border border-border">
              <p className="text-xs text-text-secondary font-medium">
                {t("reviews.no_reviews")}
              </p>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed max-w-xs mx-auto">
                {t("reviews.no_reviews_desc")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-bg-surface border border-border p-5 transition-all duration-200 hover:border-primary/40 space-y-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* User Profile Info */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-none bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                        {(rev.userFirstName || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary">
                          {rev.userFirstName || "Usuario"} {rev.userLastName || t("reviews.anonymous")}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {new Date(rev.createdAt).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < rev.rating ? "text-amber-500" : "text-zinc-300 dark:text-zinc-700"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-text-secondary leading-relaxed font-medium pl-9">
                      &quot;{rev.comment}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

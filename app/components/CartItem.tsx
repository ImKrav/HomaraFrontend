"use client";

import { useState, useEffect } from "react";
import { type Product, formatPrice } from "@/app/lib/utils";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { useLanguage } from "@/app/context/LanguageContext";

interface CartItemCardProps {
  product: Product;
  quantity: number;
  updatedAt?: string;
  isBackorder?: boolean;
  backorderQuantity?: number;
  availableStock?: number;
  onQuantityChange?: (quantity: number) => void;
  onRemove?: () => void;
}

export default function CartItemCard({
  product,
  quantity,
  updatedAt,
  isBackorder,
  backorderQuantity,
  onQuantityChange,
  onRemove,
}: CartItemCardProps) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!updatedAt) return;
    
    const calculateTimeLeft = () => {
      const updatedTime = new Date(updatedAt).getTime();
      const expiresAt = updatedTime + 15 * 60 * 1000; // 15 minutes
      const now = new Date().getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        return "expired";
      }

      const minutes = Math.floor(diff / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const initial = calculateTimeLeft();
    
    // Defer state update to avoid synchronous setState inside useEffect body
    const timeoutId = setTimeout(() => {
      setTimeLeft(initial);
    }, 0);

    if (initial === "expired") {
      return () => clearTimeout(timeoutId);
    }

    const interval = setInterval(() => {
      const next = calculateTimeLeft();
      setTimeLeft(next);
      if (next === "expired") {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [updatedAt]);

  return (
    <div className="flex gap-4 bg-bg-surface rounded-none border border-border p-4">
      {/* Image placeholder */}
      <div className="flex-shrink-0 w-20 h-20 bg-bg-surface-light rounded-none flex items-center justify-center text-primary/80">
        <LucideIcon name={product.categorySlug} size={32} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-text-primary truncate">
          {product.name}
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          {formatPrice(product.price)} / {product.unit}
        </p>

        {/* Reservation and Backorder tags */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {updatedAt && (
            timeLeft === "expired" ? (
              <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 border border-rose-500/20">
                <LucideIcon name="Clock" size={12} className="mr-1" />
                {t("cart.reservation_expired")}
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 border border-emerald-500/20">
                <LucideIcon name="Clock" size={12} className="mr-1 animate-pulse" />
                {t("cart.reservation_active")}{timeLeft}
              </span>
            )
          )}

          {isBackorder && (
            <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 border border-amber-500/20">
              {backorderQuantity && backorderQuantity > 0 
                ? t("cart.backorder_qty").replace("{qty}", backorderQuantity.toString())
                : t("cart.backorder_label")}
            </span>
          )}

          {updatedAt && !isBackorder && (
            <span className="text-[10px] font-medium text-text-muted">
              {t("cart.available_reserved")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Quantity controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onQuantityChange?.(Math.max(1, quantity - 1))
              }
              className="w-7 h-7 flex items-center justify-center rounded-none bg-bg-surface-light text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-colors text-sm"
              aria-label="-"
            >
              −
            </button>
            <span className="text-sm font-medium text-text-primary w-8 text-center">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange?.(quantity + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-none bg-bg-surface-light text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-colors text-sm"
              aria-label="+"
            >
              +
            </button>
          </div>

          {/* Subtotal + Remove */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-text-primary">
              {formatPrice(product.price * quantity)}
            </span>
            <button
              onClick={onRemove}
              className="p-1 text-text-muted hover:text-error transition-colors"
              aria-label={t("catalog.remove_item")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

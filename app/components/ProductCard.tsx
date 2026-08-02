"use client";

import Link from "next/link";
import Badge from "@/app/components/ui/Badge";
import { type Product, formatPrice } from "@/app/lib/utils";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { useLanguage } from "@/app/context/LanguageContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { t } = useLanguage();

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <Link href={`/catalogo/${product.id}`} className="group block">
      <div className="bg-bg-surface rounded-none border border-border overflow-hidden card-hover relative flex flex-col h-full">
        {/* Image area */}
        <div className="relative aspect-[4/3] bg-bg-surface-light overflow-hidden border-b border-border flex items-center justify-center">
          {/* Subtle grid pattern background to make it look technical and premium */}
          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative flex items-center justify-center text-primary/30 group-hover:scale-110 group-hover:text-primary/50 transition-all duration-500 ease-out">
            <LucideIcon name={product.categorySlug} size={56} />
          </div>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {discount > 0 && (
              <Badge variant="error" size="sm">
                -{discount}%
              </Badge>
            )}
            {product.tags.includes("nuevo") && (
              <Badge variant="info" size="sm">
                {t("catalog.badge_new")}
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="warning" size="sm">
                {t("catalog.badge_backorder")}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">
              {t(`categories.${product.categorySlug}`) || t(`categories.${product.category}`) || product.category}
            </p>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-text-secondary transition-colors duration-200 line-clamp-2 leading-snug tracking-tight">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(product.rating)
                        ? "text-amber-500"
                        : "text-zinc-300 dark:text-zinc-700"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-[10px] text-text-muted font-medium">
                ({product.reviews})
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-text-muted line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">
                {t("catalog.per_unit")} {product.unit}
              </p>
            </div>
            
            {/* Elegant tiny button hover indicator */}
            <span className="w-7 h-7 flex items-center justify-center bg-bg-surface-light border border-border text-text-primary group-hover:bg-primary group-hover:text-bg-base transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

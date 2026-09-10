"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPrice, Product } from "@/app/lib/utils";
import Badge from "@/app/components/ui/Badge";
import UseInProjectButton from "@/app/components/UseInProjectButton";
import LucideIcon from "@/app/components/ui/LucideIcon";
import ProductCard from "@/app/components/ProductCard";
import AddToCartButton from "@/app/components/AddToCartButton";
import ProductReviews from "@/app/components/ProductReviews";
import { useLanguage } from "@/app/context/LanguageContext";
import { api } from "@/app/lib/api";

interface ProductDetailData extends Product {
  description: string;
  relatedProducts: Product[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await api.get(`/api/v1/products/${id}`);
        if (!res.success || !res.data) { setNotFound(true); return; }
        setProduct(res.data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-text-secondary text-sm">
        {t("catalog.no_results")}
      </div>
    );
  }

  const relatedProducts = product.relatedProducts || [];
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
        <Link href="/catalogo" className="hover:text-primary transition-colors">
          {t("catalog.breadcrumb_catalog")}
        </Link>
        <span>/</span>
        <Link
          href={`/catalogo?cat=${product.categorySlug}`}
          className="hover:text-primary transition-colors"
        >
          {t(`categories.${product.categorySlug}`) || t(`categories.${product.category}`) || product.category}
        </Link>
        <span>/</span>
        <span className="text-text-secondary truncate">{product.name}</span>
      </nav>

      {/* Product Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-bg-surface rounded-none border border-border aspect-square flex items-center justify-center relative overflow-hidden">
          <div className="text-text-muted opacity-10">
            <LucideIcon name={product.categorySlug} size={120} />
          </div>
          {discount > 0 && (
            <div className="absolute top-4 left-4">
              <Badge variant="error">-{discount}%</Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge>{t(`categories.${product.categorySlug}`) || t(`categories.${product.category}`) || product.category}</Badge>
            {product.tags.includes("nuevo") && (
              <Badge variant="info">{t("catalog.badge_new")}</Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-0.5">
              {[...new Array(5)].map((_, i) => (
                <svg
                  key={`${product.id}-star-${i}`}
                  className={`h-4 w-4 ${
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
            <span className="text-sm text-text-secondary">
              {product.rating} ({product.reviews} {t("catalog.reviews_count")})
            </span>
          </div>

          {/* Price */}
          <div className="mt-6 p-4 bg-bg-surface-light rounded-xl">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-text-primary">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice ? (
                <span className="text-lg text-text-muted line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-text-muted mt-1">
              {t("catalog.per_unit")} {product.unit} • {t("catalog.vat_included")}
            </p>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              {t("catalog.description")}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Stock */}
          <div className="mt-6 flex flex-col gap-2">
            {product.inStock ? (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-sm text-success">
                  {t("catalog.in_stock_qty")} ({product.stockQuantity} {t("catalog.available_units")})
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-semibold">{t("catalog.badge_backorder")}</span>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                  {t("catalog.backorder_warning")}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <AddToCartButton 
              productId={product.id} 
              disabled={false} 
              fullWidth={true} 
            />
            {["pisos-ceramicas", "pinturas", "materiales-construccion"].includes(product.categorySlug) && (
              <UseInProjectButton 
                productId={product.id}
                productName={product.name}
                categorySlug={product.categorySlug}
              />
            )}
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      <ProductReviews productId={product.id} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-text-primary mb-8">
            {t("catalog.related_products")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p: Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

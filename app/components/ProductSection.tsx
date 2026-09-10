import ProductCard from "@/app/components/ProductCard";
import { type Product } from "@/app/lib/utils";

interface ProductSectionProps {
  title: string;
  description: string;
  products: Product[];
  loading?: boolean;
  skeletonKeyPrefix: string;
}

export default function ProductSection({
  title,
  description,
  products,
  loading = false,
  skeletonKeyPrefix,
}: ProductSectionProps) {
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border/60">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-primary" />
            <h2 className="text-xs uppercase tracking-widest font-extrabold text-text-primary">
              {title}
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? new Array(4)
              .fill(null)
              .map((_, i) => (
                <div
                  key={`${skeletonKeyPrefix}-${i}`}
                  className="border border-border p-4 bg-bg-surface space-y-4 animate-pulse"
                >
                  <div className="aspect-[4/3] bg-bg-surface-light w-full" />
                  <div className="h-4 bg-bg-surface-light w-2/3" />
                  <div className="h-4 bg-bg-surface-light w-1/3" />
                </div>
              ))
          : products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>
    </section>
  );
}

import Link from "next/link";
import { type Category } from "@/app/lib/utils";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { useLanguage } from "@/app/context/LanguageContext";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { t } = useLanguage();
  return (
    <Link
      href={`/catalogo?cat=${category.slug}`}
      className="group block"
    >
      <div className="relative bg-bg-surface rounded-none border border-border p-5 card-hover overflow-hidden text-center flex flex-col items-center justify-center min-h-[120px]">
        {/* Clean solid color background on hover */}
        <div className="absolute inset-0 bg-bg-surface-light opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div className="relative z-10">
          <div className="flex justify-center mb-2.5 group-hover:scale-105 transition-transform duration-300 text-text-primary">
            <LucideIcon name={category.slug} size={28} />
          </div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-tight">
            {t("categories." + category.slug) || category.name}
          </h3>
          <p className="mt-1 text-[10px] text-text-muted font-medium">
            {category.productCount} {t("cart.products_count")}
          </p>
        </div>
      </div>
    </Link>
  );
}

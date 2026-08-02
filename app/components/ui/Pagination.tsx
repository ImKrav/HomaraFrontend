"use client";

import LucideIcon from "./LucideIcon";
import { useLanguage } from "@/app/context/LanguageContext";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemTypeLabel?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemTypeLabel,
}: PaginationProps) {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Build page numbers with ellipsis
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
      {/* Results summary */}
      <p className="text-[11px] text-text-muted font-medium tracking-wide order-2 sm:order-1">
        {t("pagination.showing")}{" "}
        <span className="font-bold text-text-primary">{startItem}–{endItem}</span>{" "}
        {t("pagination.of")}{" "}
        <span className="font-bold text-text-primary">{totalItems}</span>{" "}
        {itemTypeLabel || t("pagination.items")}
      </p>

      {/* Navigation controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 border border-border text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary bg-bg-surface text-text-secondary"
          aria-label={t("pagination.previous")}
        >
          <LucideIcon name="ChevronLeft" size={12} />
          <span className="hidden sm:inline">{t("pagination.previous")}</span>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2 text-[10px] text-text-muted font-bold select-none"
            >
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[34px] px-2 py-2 border text-[11px] font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                page === currentPage
                  ? "bg-primary text-bg-base border-primary"
                  : "bg-bg-surface text-text-secondary border-border hover:border-primary hover:text-primary"
              }`}
              aria-label={`Ir a página ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 border border-border text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary bg-bg-surface text-text-secondary"
          aria-label={t("pagination.next")}
        >
          <span className="hidden sm:inline">{t("pagination.next")}</span>
          <LucideIcon name="ChevronRight" size={12} />
        </button>
      </div>
    </div>
  );
}

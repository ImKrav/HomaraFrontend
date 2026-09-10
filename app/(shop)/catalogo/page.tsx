"use client";

import { useState, useEffect, Suspense } from "react";
import ProductCard from "@/app/components/ProductCard";
import SearchBar from "@/app/components/SearchBar";
import LucideIcon from "@/app/components/ui/LucideIcon";
import Pagination from "@/app/components/ui/Pagination";
import { api } from "@/app/lib/api";
import { type Product, type Category } from "@/app/lib/utils";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";

function CatalogoContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "todos");
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState<string>(searchParam || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useLanguage();

  const ITEMS_PER_PAGE = 25;

  // Sincronizar parámetros desde la URL
  useEffect(() => {
    setSelectedCategory(categoryParam || "todos");
  }, [categoryParam]);

  useEffect(() => {
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
  }, [searchParam]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "todos") {
      params.set("category", selectedCategory);
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    const queryString = params.toString();
    const newUrl = queryString ? `/catalogo?${queryString}` : "/catalogo";
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }
  }, [selectedCategory, searchQuery]);

  // Carga de categorías iniciales
  useEffect(() => {
    async function fetchCategories() {
      try {
        const catRes = await api.get("/api/v1/categories");
        if (catRes.success) setCategories(catRes.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  // Carga de productos reactiva a categoría y ordenación
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const endpoint = selectedCategory === "todos" 
          ? "/api/v1/products" 
          : `/api/v1/products?category=${selectedCategory}`;
        const prodRes = await api.get(endpoint);
        if (prodRes.success) {
          setProducts(prodRes.data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [selectedCategory]);

  // Filtrado de productos en el cliente
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = product.rating >= minRating;
    return matchesSearch && matchesRating;
  });

  // Ordenación de productos en el cliente
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "precio-asc") {
      return a.price - b.price;
    }
    if (sortBy === "precio-desc") {
      return b.price - a.price;
    }
    if (sortBy === "rating") {
      return b.rating - a.rating;
    }
    // popular
    return b.reviews - a.reviews;
  });

  // Paginación client-side
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, minRating, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 bg-primary" />
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-text-muted">{t("catalog.title")}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary uppercase tracking-tight mt-1">{t("catalog.title")}</h1>
        <p className="mt-1.5 text-xs text-text-secondary">
          {t("catalog.subtitle")}
        </p>
      </div>

      {/* Search */}
      <div className="mb-8 max-w-2xl">
        <SearchBar 
          onSearch={(query) => setSearchQuery(query)} 
          placeholder={t("catalog.search_placeholder")}
          className="shadow-sm"
          initialValue={searchQuery}
        />
        {searchQuery && (
          <div className="flex items-center gap-2 mt-3 text-xs text-text-secondary">
            <span>Resultados para: <strong>&quot;{searchQuery}&quot;</strong></span>
            <button onClick={() => setSearchQuery("")} className="text-error font-semibold hover:underline">{t("catalog.clean_search")}</button>
          </div>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-8 border-b border-border pb-6">
        {/* Category filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-5 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory("todos")}
            className={`px-4 py-2 border text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedCategory === "todos"
                ? "bg-primary text-bg-base border-primary"
                : "bg-bg-surface text-text-secondary border-border hover:border-primary hover:text-text-primary"
            }`}
          >
            {t("catalog.all_categories")}
          </button>
          {categories.map((cat: Category) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 border text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedCategory === cat.slug
                  ? "bg-primary text-bg-base border-primary"
                  : "bg-bg-surface text-text-secondary border-border hover:border-primary hover:text-text-primary"
              }`}
            >
              <LucideIcon name={cat.slug} size={14} />
              <span>{t(`categories.${cat.slug}`) || t(`categories.${cat.name}`) || cat.name}</span>
            </button>
          ))}
        </div>

        {/* Sort & Rating Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-6 self-end lg:self-auto w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-text-muted whitespace-nowrap">{t("catalog.rating")}</span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="bg-bg-surface border border-border rounded-none px-4 py-2.5 text-xs font-bold text-text-primary uppercase tracking-wider focus:outline-none focus:border-primary transition-colors cursor-pointer w-full sm:w-auto"
              id="min-rating"
            >
              <option value={0}>{t("catalog.all_categories")}</option>
              <option value={4.5}>4.5+ ★</option>
              <option value={4.0}>4.0+ ★</option>
              <option value={3.0}>3.0+ ★</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-text-muted whitespace-nowrap">{t("catalog.sort_by")}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-bg-surface border border-border rounded-none px-4 py-2.5 text-xs font-bold text-text-primary uppercase tracking-wider focus:outline-none focus:border-primary transition-colors cursor-pointer w-full sm:w-auto"
              id="sort-by"
            >
              <option value="popular">{t("catalog.sort_popular")}</option>
              <option value="precio-asc">{t("catalog.sort_price_asc")}</option>
              <option value="precio-desc">{t("catalog.sort_price_desc")}</option>
              <option value="rating">{t("catalog.sort_rating")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-text-muted font-medium mb-6">
        {loading ? t("catalog.updating") : `${sortedProducts.length} ${t("catalog.results_found")}`}
      </p>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? new Array(8)
              .fill(null)
              .map((_, i) => (
                <div key={`skeleton-product-${i}`} className="border border-border p-4 bg-bg-surface space-y-4 animate-pulse">
                  <div className="aspect-[4/3] bg-bg-surface-light w-full" />
                  <div className="h-4 bg-bg-surface-light w-2/3" />
                  <div className="h-4 bg-bg-surface-light w-1/3" />
                </div>
              ))
          : paginatedProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {/* Pagination */}
      {!loading && sortedProducts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedProducts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* Empty state */}
      {!loading && sortedProducts.length === 0 && (
        <div className="text-center py-20 bg-bg-surface border border-border mt-6">
          <div className="text-text-muted mb-4 flex justify-center">
            <LucideIcon name="Search" size={40} />
          </div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight mb-2">
            {t("catalog.no_results")}
          </h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            {t("catalog.no_results_desc")}
          </p>
          <button
            onClick={() => {
              setSelectedCategory("todos");
              setMinRating(0);
              setSearchQuery("");
            }}
            className="mt-6 px-5 py-2.5 bg-primary text-bg-base text-xs uppercase tracking-wider font-bold border border-primary hover:bg-primary-light transition-colors"
          >
            {t("catalog.view_all")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CatalogoPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-sm text-text-secondary">{t("catalog.updating")}</p>
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect } from "react";
import Card from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import LucideIcon from "@/app/components/ui/LucideIcon";
import Pagination from "@/app/components/ui/Pagination";
import SearchInput from "@/app/components/ui/SearchInput";
import { formatPrice, InventoryProduct } from "@/app/lib/utils";
import { api } from "@/app/lib/api";
import { useLanguage } from "@/app/context/LanguageContext";

export default function AdminInventarioPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState("all");
  const { t } = useLanguage();

  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    async function fetchInventory() {
      try {
        setLoading(true);
        setError(null);
        const json = await api.get("/api/v1/admin/inventory");
        if (json.success && json.data) {
          setProducts(json.data.products || []);
          setStats(json.data.stats || {
            totalProducts: 0,
            totalUnits: 0,
            lowStockCount: 0,
            outOfStockCount: 0
          });
        } else {
          setError(json.error || "Error al cargar el inventario");
        }
      } catch (err: unknown) {
        console.error("Error cargando inventario:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, []);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedAlert]);

  // Extract categories dynamically from the products list
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  const lowStock = products.filter(
    (p: InventoryProduct) => p.stockQuantity > 0 && p.stockQuantity < 50
  );
  const outOfStock = products.filter((p: InventoryProduct) => !p.inStock);
  const totalUnits = stats.totalUnits || 0;

  // Filter products client-side
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    
    let matchesAlert = true;
    if (selectedAlert === "low_stock") {
      matchesAlert = p.stockQuantity > 0 && p.stockQuantity < 50;
    } else if (selectedAlert === "out_of_stock") {
      matchesAlert = !p.inStock;
    } else if (selectedAlert === "normal_stock") {
      matchesAlert = p.stockQuantity >= 50;
    }

    return matchesSearch && matchesCategory && matchesAlert;
  });

  // Sort filtered products by stock quantity (so warnings/out of stock come first)
  const sortedFilteredProducts = [...filteredProducts].sort(
    (a, b) => a.stockQuantity - b.stockQuantity
  );

  // Pagination
  const totalPages = Math.ceil(sortedFilteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedFilteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="p-8 text-center text-text-secondary">
        {t("admin.loading_inventory")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-error">
        <p className="font-semibold">{t("admin.error_loading_inventory")}</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">{t("admin.inventory")}</h1>
        <p className="mt-2 text-text-secondary">
          {t("admin.control_tagline")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: t("admin.metrics.total_products"),
            value: products.length,
            icon: "Package",
          },
          {
            label: t("admin.metrics.units_in_stock"),
            value: totalUnits.toLocaleString(),
            icon: "Layers",
          },
          {
            label: t("admin.metrics.low_stock"),
            value: lowStock.length,
            icon: "Maximize2",
          },
          {
            label: t("admin.metrics.out_of_stock"),
            value: outOfStock.length,
            icon: "PauseCircle",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {stat.value}
                </p>
              </div>
              <div className="text-primary/80 flex items-center justify-center">
                <LucideIcon name={stat.icon} size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="mb-8 p-4 bg-warning/5 border border-warning/20 rounded-none flex items-start gap-3">
          <div className="text-warning mt-0.5">
            <LucideIcon name="Maximize2" size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-warning mb-1">
              {t("admin.alerts_title")}
            </h3>
            <p className="text-sm text-text-secondary">
              {lowStock.length} {t("admin.alerts_desc")} {outOfStock.length} {t("admin.alerts_desc_end")}
            </p>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-bg-surface border border-border p-4">
        {/* Search */}
        <SearchInput
          placeholder={t("catalog.search_placeholder")}
          value={searchQuery}
          onChange={setSearchQuery}
        />

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-bg-base text-text-primary text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">{t("catalog.all_categories")}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categories.${cat}`) || cat}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Alert Filter */}
        <div>
          <select
            value={selectedAlert}
            onChange={(e) => setSelectedAlert(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-bg-base text-text-primary text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">{t("catalog.all_categories")} ({t("admin.stock_col")})</option>
            <option value="low_stock">{t("admin.metrics.low_stock")}</option>
            <option value="out_of_stock">{t("admin.metrics.out_of_stock")}</option>
            <option value="normal_stock">{t("admin.metrics.normal_stock")}</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  {t("admin.product_col")}
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  {t("admin.category_col")}
                </th>
                <th className="text-right py-3 px-4 text-text-muted font-medium">
                  {t("admin.stock_col")}
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  {t("admin.unit_col")}
                </th>
                <th className="text-right py-3 px-4 text-text-muted font-medium">
                  {t("admin.stock_value_col")}
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  {t("admin.status_col")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product: InventoryProduct) => {
                const stockStatus =
                  product.stockQuantity === 0
                    ? "error"
                    : product.stockQuantity < 50
                    ? "warning"
                    : "success";
                const stockLabel =
                  product.stockQuantity === 0
                    ? t("admin.metrics.out_of_stock")
                    : product.stockQuantity < 50
                    ? t("admin.metrics.low_stock")
                    : t("admin.metrics.normal_stock");

                return (
                  <tr
                    key={product.id}
                    className="border-b border-border/50 hover:bg-bg-surface-light transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {product.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {t(`categories.${product.category}`) || product.category}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-text-primary">
                      {product.stockQuantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {product.unit}
                    </td>
                    <td className="py-3 px-4 text-right text-text-primary">
                      {formatPrice(product.price * product.stockQuantity)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={stockStatus as "success" | "warning" | "error"}
                        size="sm"
                      >
                        {stockLabel}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    {products.length === 0 ? t("admin.no_inventory") : t("catalog.no_results")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {sortedFilteredProducts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedFilteredProducts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
}

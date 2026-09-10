"use client";

import React, { useState, useEffect, useCallback } from "react";
import Card from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import Button from "@/app/components/ui/Button";
import LucideIcon from "@/app/components/ui/LucideIcon";
import Input from "@/app/components/ui/Input";
import Pagination from "@/app/components/ui/Pagination";
import SearchInput from "@/app/components/ui/SearchInput";
import { formatPrice, Product, Category } from "@/app/lib/utils";
import { api } from "@/app/lib/api";
import { showToast } from "@/app/lib/toast";
import { useLanguage } from "@/app/context/LanguageContext";

export default function AdminProductosPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStock, setSelectedStock] = useState("all");

  const ITEMS_PER_PAGE = 25;

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOriginalPrice, setFormOriginalPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formUnit, setFormUnit] = useState("unidad");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formImage, setFormImage] = useState("/products/placeholder.jpg");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  const fetchProductsAndCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/api/v1/products?limit=100"),
        api.get("/api/v1/categories")
      ]);

      if (productsRes.success) {
        setProducts(productsRes.data || []);
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.data || []);
      }
    } catch (err: unknown) {
      console.error("Error al cargar datos:", err);
      setError(err instanceof Error ? err.message : t("admin.product_errors.catalog_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  // Open form modal for adding a new product
  const handleAddClick = () => {
    setSelectedProduct(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormOriginalPrice("");
    setFormStock("");
    setFormUnit("unidad");
    setFormCategoryId(categories[0]?.id || "");
    setFormImage("/products/placeholder.jpg");
    setFormTags([]);
    setFormError("");
    setIsFormOpen(true);
  };

  // Open form modal for editing an existing product
  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setFormName(product.name || "");
    setFormDescription(product.description || "");
    setFormPrice(product.originalPrice ? String(product.originalPrice) : String(product.price || ""));
    setFormOriginalPrice(product.originalPrice ? String(product.price) : "");
    setFormStock(product.stockQuantity ? String(product.stockQuantity) : "0");
    setFormUnit(product.unit || "unidad");
    setFormCategoryId(product.categoryId || categories.find(c => c.slug === product.categorySlug)?.id || "");
    setFormImage(product.image || "/products/placeholder.jpg");
    setFormTags(product.tags || []);
    setFormError("");
    setIsFormOpen(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleTagChange = (tag: string) => {
    if (formTags.includes(tag)) {
      setFormTags(formTags.filter(t => t !== tag));
    } else {
      setFormTags([...formTags, tag]);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName || !formDescription || !formPrice || !formStock || !formCategoryId) {
      setFormError(t("admin.required_fields_error"));
      return;
    }

    const normalPriceNum = Math.floor(Number(formPrice));
    const offerPriceNum = formOriginalPrice ? Math.floor(Number(formOriginalPrice)) : null;
    const stockNum = Math.floor(Number(formStock));

    if (isNaN(normalPriceNum) || normalPriceNum <= 0) {
      setFormError(t("admin.price_error"));
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setFormError(t("admin.stock_error"));
      return;
    }

    if (offerPriceNum !== null && (isNaN(offerPriceNum) || offerPriceNum <= 0 || offerPriceNum >= normalPriceNum)) {
      setFormError(t("admin.offer_price_error"));
      return;
    }

    const payload = {
      name: formName,
      description: formDescription,
      price: offerPriceNum ?? normalPriceNum,
      originalPrice: offerPriceNum ? normalPriceNum : null,
      stockQuantity: stockNum,
      unit: formUnit,
      categoryId: formCategoryId,
      image: formImage || "/products/placeholder.jpg",
      tags: formTags,
    };

    try {
      setSaving(true);
      let res;
      if (selectedProduct) {
        res = await api.put(`/api/v1/products/${selectedProduct.id}`, payload);
      } else {
        res = await api.post("/api/v1/products", payload);
      }

      if (res.success) {
        showToast(t("admin.save_success"), "success");
        setIsFormOpen(false);
        setCurrentPage(1);
        fetchProductsAndCategories();
      } else {
        setFormError(res.error || t("admin.product_errors.save_error"));
      }
    } catch (err: unknown) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "Error del servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    try {
      setDeleting(true);
      const res = await api.delete(`/api/v1/products/${selectedProduct.id}`);

      if (res.success) {
        showToast(t("admin.delete_success"), "success");
        setIsDeleteOpen(false);
        setCurrentPage(1);
        fetchProductsAndCategories();
      } else {
        showToast(res.error || t("admin.product_errors.delete_error"), "error");
      }
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Error del servidor", "error");
    } finally {
      setDeleting(false);
    }
  };

  const totalStockValue = products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0);
  const outOfStockCount = products.filter(p => p.stockQuantity <= 0).length;

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesStock = selectedStock === "all" 
      ? true 
      : selectedStock === "in_stock" 
      ? p.stockQuantity > 0 
      : p.stockQuantity <= 0;
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStock]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading && products.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary">
        {t("admin.loading_catalog")}
      </div>
    );
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-none text-error text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t("admin.products")}</h1>
          <p className="mt-2 text-text-secondary">
            {t("admin.catalog_tagline")}
          </p>
        </div>
        <Button 
          id="btn-add-product"
          size="md" 
          onClick={handleAddClick}
          className="cursor-pointer font-semibold"
        >
          <LucideIcon name="Plus" className="mr-2" size={16} />
          {t("admin.add_product_btn")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: t("admin.metrics.total_products"), value: products.length, icon: "Package" },
          { label: t("admin.active_categories"), value: categories.length, icon: "Grid" },
          { label: t("admin.inventory_value"), value: formatPrice(totalStockValue), icon: "DollarSign" },
          { label: t("admin.out_of_stock_alert"), value: outOfStockCount, icon: "AlertCircle" },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-muted font-bold uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-text-primary mt-2">
                  {stat.value}
                </p>
              </div>
              <div className="text-primary bg-primary/10 w-10 h-10 flex items-center justify-center border border-primary/20">
                <LucideIcon name={stat.icon === "AlertCircle" ? "PauseCircle" : stat.icon} size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

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
              <option key={cat.id} value={cat.id}>
                {t(`categories.${cat.slug}`) || cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div>
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-bg-base text-text-primary text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">{t("catalog.all_categories")} ({t("admin.stock_col")})</option>
            <option value="in_stock">{t("catalog.in_stock")}</option>
            <option value="out_of_stock">{t("admin.metrics.out_of_stock")}</option>
          </select>
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-bg-surface-light/40">
                <th className="py-3.5 px-4 text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.product_col")}
                </th>
                <th className="py-3.5 px-4 text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.category_col")}
                </th>
                <th className="py-3.5 px-4 text-right text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("projects.unit_price")}
                </th>
                <th className="py-3.5 px-4 text-right text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.stock_col")}
                </th>
                <th className="py-3.5 px-4 text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.status_col")}
                </th>
                <th className="py-3.5 px-4 text-right text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.actions_col")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginatedProducts.map((product: Product) => (
                <tr
                  key={product.id}
                  className="hover:bg-bg-surface-light transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-bg-surface-light border border-border flex items-center justify-center text-primary/80 flex-shrink-0">
                        <LucideIcon name={product.categorySlug} size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-text-primary block truncate max-w-[240px]">
                          {product.name}
                        </span>
                        <span className="text-[10px] text-text-muted truncate block max-w-[240px] font-mono">
                          {product.id}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-text-secondary font-medium">
                    {t(`categories.${product.categorySlug}`) || t(`categories.${product.category}`) || product.category}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-text-primary">
                    <div className="flex flex-col items-end">
                      <span>{formatPrice(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-text-muted line-through font-normal">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-text-secondary font-mono">
                    {product.stockQuantity} <span className="text-[10px] text-text-muted uppercase font-sans font-medium">{t(`admin.units.abbr_${product.unit}`)}</span>
                  </td>
                  <td className="py-3 px-4">
                    {product.stockQuantity > 0 ? (
                      <Badge variant="success" size="sm">
                        {t("admin.active_badge")}
                      </Badge>
                    ) : (
                      <Badge variant="error" size="sm">
                        {t("admin.metrics.out_of_stock")}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        id={`btn-edit-product-${product.id}`}
                        onClick={() => handleEditClick(product)}
                        className="p-2 text-text-muted hover:text-primary transition-colors border border-transparent hover:border-border hover:bg-bg-surface-light cursor-pointer"
                        title="Editar Producto"
                      >
                        <LucideIcon name="Maximize2" size={14} />
                      </button>
                      <button 
                        id={`btn-delete-product-${product.id}`}
                        onClick={() => handleDeleteClick(product)}
                        className="p-2 text-text-muted hover:text-error transition-colors border border-transparent hover:border-border hover:bg-bg-surface-light cursor-pointer"
                        title="Eliminar Producto"
                      >
                        <LucideIcon name="PauseCircle" size={14} className="text-error/70" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedProducts.length === 0 && (
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
      {filteredProducts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* Create / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-surface border border-border p-6 max-w-xl w-full rounded-none shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
            {/* Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 gradient-primary" />

            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h3 className="text-xl font-bold text-text-primary tracking-tight">
                {selectedProduct ? t("admin.edit_title") : t("admin.add_title")}
              </h3>
              <button 
                id="btn-close-modal"
                onClick={() => setIsFormOpen(false)}
                className="text-text-muted hover:text-text-primary p-1.5 hover:bg-bg-surface-light transition-colors duration-200 cursor-pointer"
              >
                <LucideIcon name="Plus" className="rotate-45" size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto pr-1 space-y-4 text-left">
              <Input
                id="input-name"
                label={t("admin.product_name_label")}
                placeholder="Ej: Pintura Interior Premium Blanco"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="input-description" className="text-sm font-medium text-text-secondary">
                  {t("admin.description_label")}
                </label>
                <textarea
                  id="input-description"
                  placeholder={t("admin.description_placeholder")}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-bg-surface border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all duration-200 min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="select-category" className="text-sm font-medium text-text-secondary">
                    {t("admin.category_col")}
                  </label>
                  <select
                    id="select-category"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full bg-bg-surface border border-border px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all duration-200 cursor-pointer rounded-none"
                    required
                  >
                    <option value="" disabled>{t("admin.select_category_placeholder")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t(`categories.${c.slug}`) || t(`categories.${c.name}`) || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="select-unit" className="text-sm font-medium text-text-secondary">
                    {t("admin.unit_measure_label")}
                  </label>
                  <select
                    id="select-unit"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-bg-surface border border-border px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all duration-200 cursor-pointer rounded-none"
                    required
                  >
                    <option value="unidad">{t("admin.units.unidad")}</option>
                    <option value="m²">{t("admin.units.m²")}</option>
                    <option value="galón">{t("admin.units.galón")}</option>
                    <option value="kg">{t("admin.units.kg")}</option>
                    <option value="bulto">{t("admin.units.bulto")}</option>
                    <option value="rollo">{t("admin.units.rollo")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  id="input-price"
                  type="number"
                  label={t("admin.price_label")}
                  placeholder="Ej: 52000"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <Input
                    id="input-original-price"
                    type="number"
                    label={t("admin.offer_price_label")}
                    placeholder="Ej: 45900"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                  />
                  {formOriginalPrice && formPrice && Number(formPrice) > Number(formOriginalPrice) && Number(formOriginalPrice) > 0 && (
                    <span className="text-[11px] font-bold text-success flex items-center gap-1">
                      <LucideIcon name="TrendingDown" size={12} />
                      {Math.round(((Number(formPrice) - Number(formOriginalPrice)) / Number(formPrice)) * 100)}% {t("admin.discount_label")}
                    </span>
                  )}
                </div>

                <Input
                  id="input-stock"
                  type="number"
                  label={t("admin.stock_label")}
                  placeholder="Ej: 1250"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  required
                />
              </div>

              <Input
                id="input-image"
                label={t("admin.image_path_label")}
                placeholder="Ej: /products/porcelanato.jpg"
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
              />

              <div className="flex flex-col gap-2 pt-2">
                <span className="text-sm font-medium text-text-secondary">{t("admin.special_tags_label")}</span>
                <div className="flex gap-6">
                  {["oferta", "popular", "nuevo"].map((tag) => (
                    <label 
                      key={tag} 
                      className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formTags.includes(tag)}
                        onChange={() => handleTagChange(tag)}
                        className="w-4 h-4 border border-border accent-primary cursor-pointer"
                      />
                      <span>{t(`admin.tags.${tag}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  disabled={saving}
                  className="rounded-none cursor-pointer"
                  type="button"
                >
                  {t("admin.cancel_btn")}
                </Button>
                <Button
                  id="btn-submit-product"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  className="rounded-none cursor-pointer font-semibold"
                  type="submit"
                >
                  {saving ? t("admin.saving_btn") : t("admin.save_btn")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-surface border border-error/30 p-6 max-w-md w-full rounded-none shadow-2xl relative animate-slide-up">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-error" />

            <h3 className="text-lg font-bold text-text-primary tracking-tight mb-2">
              {t("admin.delete_title")}
            </h3>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              {t("admin.delete_confirm_desc")} <strong className="text-text-primary">{selectedProduct.name}</strong> {t("admin.delete_confirm_desc_end")}
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleting}
                className="rounded-none cursor-pointer"
              >
                {t("admin.cancel_btn")}
              </Button>
              <Button
                id="btn-confirm-delete"
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-none cursor-pointer font-semibold"
              >
                {deleting ? t("admin.deleting_btn") : t("admin.delete_permanently")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

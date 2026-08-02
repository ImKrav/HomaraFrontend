"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ProductCard from "@/app/components/ProductCard";
import Button from "@/app/components/ui/Button";
import { api } from "@/app/lib/api";
import { type Product } from "@/app/lib/utils";
import { useLanguage } from "@/app/context/LanguageContext";

export default function StorefrontHome() {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [offerProducts, setOfferProducts] = useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { t } = useLanguage();

  // Carga de datos iniciales
  useEffect(() => {
    async function fetchStorefrontData() {
      try {
        setLoading(true);
        const storefrontRes = await api.get("/api/v1/products/storefront");

        if (storefrontRes.success && storefrontRes.data) {
          setRecommendedProducts(storefrontRes.data.recommended || []);
          setOfferProducts(storefrontRes.data.offers || []);
          setBestSellerProducts(storefrontRes.data.bestSellers || []);
        }
      } catch (error) {
        console.error("Error fetching storefront data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStorefrontData();
  }, []);

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-bg-base">
        {/* ============================================
           SECCIÓN DE BANNERS PROMOCIONALES (GRID ASIMÉTRICO)
           ============================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Banner Principal (2/3 de ancho) */}
            <div className="lg:col-span-2 bg-primary text-bg-base p-8 sm:p-12 flex flex-col justify-between border border-primary relative overflow-hidden group min-h-[420px]">
              {/* Decorative engineering/architectural blueprint accent lines */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] border-draw">
                <div className="absolute top-0 left-1/4 w-[1px] h-full bg-bg-base" />
                <div className="absolute top-0 left-2/4 w-[1px] h-full bg-bg-base" />
                <div className="absolute top-0 left-3/4 w-[1px] h-full bg-bg-base" />
                <div className="absolute left-0 top-1/3 w-full h-[1px] bg-bg-base" />
                <div className="absolute left-0 top-2/3 w-full h-[1px] bg-bg-base" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-light border border-zinc-800 text-[10px] uppercase tracking-wider font-semibold mb-6">
                  <span className="h-1.5 w-1.5 bg-success" />
                  {t("home.smart_estimator")}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight uppercase leading-[1.1] max-w-2xl mb-4">
                  {t("home.material_calc")}<br />
                  <span className="text-zinc-400">{t("home.exact_one_click")}</span>
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mb-8 font-medium">
                  {t("hero.subtitle")}
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start">
                <Button href="/proyectos/nuevo" variant="white" className="uppercase tracking-wider text-xs font-bold w-full sm:w-auto">
                  {t("projects.new_project")}
                </Button>
                <Link href="/catalogo" className="px-6 py-3 border border-zinc-700 hover:border-bg-base text-zinc-300 hover:text-bg-base text-xs uppercase tracking-wider font-bold transition-all duration-200 w-full sm:w-auto text-center">
                  {t("hero.cta_catalog")}
                </Link>
              </div>
            </div>

            {/* Banner Secundario Superior */}
            <div className="flex flex-col gap-6 justify-between">
              {/* Banner Promo 2 */}
              <div className="bg-bg-surface border border-border p-6 flex flex-col justify-between flex-1 relative overflow-hidden group min-h-[200px]">
                <div className="absolute inset-0 bg-bg-surface-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="relative z-10">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-text-muted">
                    {t("home.new_collection")}
                  </span>
                  <h2 className="text-lg font-bold text-text-primary uppercase mt-1 mb-2 tracking-tight">
                    {t("home.matte_stone")}
                  </h2>
                  <p className="text-xs text-text-secondary leading-relaxed max-w-[240px]">
                    {t("home.matte_stone_desc")}
                  </p>
                </div>
                <div className="relative z-10 mt-4">
                  <Button href="/catalogo?category=pisos-ceramicas" variant="outline" size="sm" className="uppercase text-[10px] tracking-wider font-bold">
                    {t("home.explore_floors")}
                  </Button>
                </div>
              </div>

              {/* Banner Promo 3 */}
              <div className="bg-bg-surface border border-border p-6 flex flex-col justify-between flex-1 relative overflow-hidden group min-h-[200px]">
                <div className="absolute inset-0 bg-bg-surface-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="relative z-10">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-text-muted">
                    {t("home.pro_tools")}
                  </span>
                  <h2 className="text-lg font-bold text-text-primary uppercase mt-1 mb-2 tracking-tight">
                    {t("home.paints_hardware")}
                  </h2>
                  <p className="text-xs text-text-secondary leading-relaxed max-w-[240px]">
                    {t("home.paints_hardware_desc")}
                  </p>
                </div>
                <div className="relative z-10 mt-4">
                  <Button href="/catalogo?category=herramientas" variant="ghost" size="sm" className="uppercase text-[10px] tracking-wider font-bold border border-border-light hover:border-primary">
                    {t("home.view_tools")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
           SECCIÓN: RECOMENDADOS PARA TI
           ============================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-primary" />
                <h2 className="text-xs uppercase tracking-widest font-extrabold text-text-primary">
                  {t("home.news_recs")}
                </h2>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {t("home.news_recs_desc")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array(4)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="border border-border p-4 bg-bg-surface space-y-4 animate-pulse">
                      <div className="aspect-[4/3] bg-bg-surface-light w-full" />
                      <div className="h-4 bg-bg-surface-light w-2/3" />
                      <div className="h-4 bg-bg-surface-light w-1/3" />
                    </div>
                  ))
              : recommendedProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
        </section>

        {/* ============================================
           SECCIÓN: OFERTAS IMPERDIBLES (CON DESCUENTO)
           ============================================ */}
        {offerProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-primary" />
                  <h2 className="text-xs uppercase tracking-widest font-extrabold text-text-primary">
                    {t("home.weekly_deals")}
                  </h2>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {t("home.weekly_deals_desc")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {offerProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ============================================
           SECCIÓN: MÁS VENDIDOS & POPULARES
           ============================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-primary" />
                <h2 className="text-xs uppercase tracking-widest font-extrabold text-text-primary">
                  {t("home.best_sellers")}
                </h2>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {t("home.best_sellers_desc")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array(4)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="border border-border p-4 bg-bg-surface space-y-4 animate-pulse">
                      <div className="aspect-[4/3] bg-bg-surface-light w-full" />
                      <div className="h-4 bg-bg-surface-light w-2/3" />
                      <div className="h-4 bg-bg-surface-light w-1/3" />
                    </div>
                  ))
              : bestSellerProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
        </section>

        {/* ============================================
           SECCIÓN DE CTA: ESTIMADOR DE MATERIALES COMPACTO
           ============================================ */}
        <section className="bg-primary text-bg-base relative overflow-hidden border-t border-primary">
          {/* Engineering blueprint grid background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#FFF_1px,transparent_1px),linear-gradient(to_bottom,#FFF_1px,transparent_1px)] [background-size:24px_24px]" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-zinc-400">Homara Project Suite</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-bg-base uppercase mt-1 mb-4 tracking-tight">
              {t("home.cta_title")}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-medium leading-relaxed">
              {t("home.cta_desc")}
            </p>
            <Button href="/proyectos/nuevo" variant="white" size="lg" className="uppercase tracking-wider text-xs font-bold px-8">
              {t("home.cta_btn")}
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ProductSection from "@/app/components/ProductSection";
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

      <main id="contenido" tabIndex={-1} className="flex-1 bg-bg-base focus:outline-none">
        {/* ============================================
           SECCIÓN DE BANNERS PROMOCIONALES (GRID ASIMÉTRICO)
           ============================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Banner Principal (2/3 de ancho) */}
            {/* Abeto: la banda de confianza; el anillo de foco pasa a crema porque el de marca no se vería aquí. */}
            <div className="lg:col-span-2 bg-secondary text-on-secondary p-8 sm:p-12 flex flex-col justify-between border border-secondary relative overflow-hidden group min-h-[420px] [--focus:var(--on-secondary)]">
              {/* Decorative engineering/architectural blueprint accent lines */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.06] border-draw">
                <div className="absolute top-0 left-1/4 w-[1px] h-full bg-on-secondary" />
                <div className="absolute top-0 left-2/4 w-[1px] h-full bg-on-secondary" />
                <div className="absolute top-0 left-3/4 w-[1px] h-full bg-on-secondary" />
                <div className="absolute left-0 top-1/3 w-full h-[1px] bg-on-secondary" />
                <div className="absolute left-0 top-2/3 w-full h-[1px] bg-on-secondary" />
              </div>

              {/* Un solo momento de entrada: el hero se arma en cascada y las promos de la derecha lo siguen. */}
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-on-secondary/10 border border-on-secondary/25 text-[11px] uppercase tracking-wider font-semibold mb-6 animate-rise">
                  <span className="h-1.5 w-1.5 bg-on-secondary" />
                  {t("home.smart_estimator")}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight uppercase leading-[1.1] max-w-2xl mb-4 animate-rise" style={{ animationDelay: "70ms" }}>
                  {t("home.material_calc")}<br />
                  <span className="text-on-secondary/75">{t("home.exact_one_click")}</span>
                </h1>
                <p className="text-on-secondary/85 text-sm sm:text-base leading-relaxed max-w-xl mb-8 font-medium animate-rise" style={{ animationDelay: "140ms" }}>
                  {t("hero.subtitle")}
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start animate-rise" style={{ animationDelay: "210ms" }}>
                <Button href="/proyectos/nuevo" variant="white" className="uppercase tracking-wider text-xs font-bold w-full sm:w-auto">
                  {t("projects.new_project")}
                </Button>
                <Link href="/catalogo" className="px-6 py-3 border border-on-secondary/50 hover:border-on-secondary text-on-secondary text-xs uppercase tracking-wider font-bold transition-[scale,border-color] duration-150 ease-out motion-safe:active:scale-[0.97] w-full sm:w-auto text-center">
                  {t("hero.cta_catalog")}
                </Link>
              </div>
            </div>

            {/* Banner Secundario Superior */}
            <div className="flex flex-col gap-6 justify-between">
              {/* Banner Promo 2 */}
              {/* Arcilla: la colección destacada (cerámica y piedra). */}
              <div className="bg-primary text-bg-base border border-primary p-6 flex flex-col justify-between flex-1 relative overflow-hidden group min-h-[200px] animate-rise [--focus:var(--bg-base)]" style={{ animationDelay: "280ms" }}>
                <div className="relative z-10">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-bg-base/90">
                    {t("home.new_collection")}
                  </span>
                  <h2 className="text-lg font-bold uppercase mt-1 mb-2 tracking-tight">
                    {t("home.matte_stone")}
                  </h2>
                  <p className="text-xs text-bg-base/90 leading-relaxed max-w-[240px]">
                    {t("home.matte_stone_desc")}
                  </p>
                </div>
                <div className="relative z-10 mt-4">
                  <Button href="/catalogo?category=pisos-ceramicas" variant="white" size="sm" className="uppercase text-[11px] tracking-wider font-bold">
                    {t("home.explore_floors")}
                  </Button>
                </div>
              </div>

              {/* Banner Promo 3 */}
              {/* Arena: la promo de herramientas, en reposo frente a las dos bandas de color. */}
              <div className="bg-bg-surface-light border border-border p-6 flex flex-col justify-between flex-1 relative overflow-hidden group min-h-[200px] animate-rise" style={{ animationDelay: "350ms" }}>
                <div className="relative z-10">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">
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
                  <Button href="/catalogo?category=herramientas" variant="ghost" size="sm" className="uppercase text-[11px] tracking-wider font-bold border border-border-light hover:border-primary">
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
        <ProductSection
          title={t("home.news_recs")}
          description={t("home.news_recs_desc")}
          products={recommendedProducts}
          loading={loading}
          skeletonKeyPrefix="recommended-skeleton"
        />

        {/* ============================================
           SECCIÓN: OFERTAS IMPERDIBLES (CON DESCUENTO)
           ============================================ */}
        <ProductSection
          title={t("home.weekly_deals")}
          description={t("home.weekly_deals_desc")}
          products={offerProducts}
          loading={false}
          skeletonKeyPrefix="offers-skeleton"
        />

        {/* ============================================
           SECCIÓN: MÁS VENDIDOS & POPULARES
           ============================================ */}
        <ProductSection
          title={t("home.best_sellers")}
          description={t("home.best_sellers_desc")}
          products={bestSellerProducts}
          loading={loading}
          skeletonKeyPrefix="bestseller-skeleton"
        />

        {/* ============================================
           SECCIÓN DE CTA: ESTIMADOR DE MATERIALES COMPACTO
           ============================================ */}
        <section className="bg-primary text-bg-base relative overflow-hidden border-t border-primary [--focus:var(--bg-base)]">
          {/* Engineering blueprint grid background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#FFF_1px,transparent_1px),linear-gradient(to_bottom,#FFF_1px,transparent_1px)] [background-size:24px_24px]" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-bg-base/90">Homara Project Suite</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-bg-base uppercase mt-1 mb-4 tracking-tight">
              {t("home.cta_title")}
            </h2>
            <p className="text-xs sm:text-sm text-bg-base/90 max-w-xl mx-auto mb-8 font-medium leading-relaxed">
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

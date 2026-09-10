"use client";

import { use, useState, useEffect } from "react";
import { formatPrice, Product, ProjectDetail } from "@/app/lib/utils";
import Badge from "@/app/components/ui/Badge";
import LucideIcon from "@/app/components/ui/LucideIcon";
import Button from "@/app/components/ui/Button";
import ProductCard from "@/app/components/ProductCard";
import ProjectActions from "@/app/components/ProjectActions";
import MaterialsListEditor from "@/app/components/MaterialsListEditor";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import { api } from "@/app/lib/api";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

function calculateGrossArea(project: ProjectDetail): number {
  const doorsDeduction = (project.deductDoors || 0) * 2.0;
  const windowsDeduction = (project.deductWindows || 0) * 1.5;
  const customDeductions = project.customSubtractions || 0;
  const totalDeductions = doorsDeduction + windowsDeduction + customDeductions;

  let grossArea = project.area + totalDeductions;
  if (project.length) {
    const l = project.length;
    const w = project.width || 0;
    const h = project.height || 0;

    if (project.type === "PISO" || project.type === "TECHO") {
      if (w > 0) grossArea = l * w;
    } else if (project.type === "PARED" && h > 0) {
      grossArea = w > 0 ? (l + w) * 2 * h : l * h;
    } else if (project.type === "INTEGRAL" && h > 0 && w > 0) {
      grossArea = (l * w) + ((l + w) * 2 * h);
    }
  }
  return grossArea;
}

function getStatusVariant(statusLower?: string): "success" | "warning" | "info" | "default" {
  if (statusLower === "completado") return "success";
  if (statusLower === "en_progreso") return "warning";
  if (statusLower === "pausado") return "info";
  return "default";
}

interface ProjectSpecSheetProps {
  project: ProjectDetail;
  grossArea: number;
  patternValue: string;
  materialValue: string;
  t: (k: string) => string;
}

function ProjectSpecSheet({
  project,
  grossArea,
  patternValue,
  materialValue,
  t,
}: Readonly<ProjectSpecSheetProps>) {
  const doorsDeduction = (project.deductDoors || 0) * 2.0;
  const windowsDeduction = (project.deductWindows || 0) * 1.5;
  const customDeductions = project.customSubtractions || 0;
  const totalDeductions = doorsDeduction + windowsDeduction + customDeductions;

  return (
    <div className="bg-bg-surface border border-border p-6 rounded-xl hover:shadow-md transition-shadow">
      <h3 className="text-base font-bold text-text-primary border-b border-border pb-3 mb-4 flex items-center gap-2">
        <LucideIcon name="Scale" className="text-primary" size={20} />
        {t("projects.project_spec_sheet")}
      </h3>

      <div className="space-y-4">
        {project.length ? (
          <div className="flex justify-between items-center text-sm text-text-secondary">
            <span>{t("projects.dimensions_label")}</span>
            <span className="font-bold text-text-primary">
              {project.length.toFixed(2)}m
              {project.width && project.width > 0 ? ` x ${project.width.toFixed(2)}m` : ""}
              {project.height && project.height > 0 ? ` x ${project.height.toFixed(2)}m` : ""}
            </span>
          </div>
        ) : null}

        <div className="flex justify-between items-center text-sm text-text-secondary">
          <span>{t("projects.gross_area_est_label")}</span>
          <span className="font-bold text-text-primary">{grossArea.toFixed(2)} m²</span>
        </div>

        {totalDeductions > 0 ? (
          <div className="space-y-1.5 pt-2 border-t border-dashed border-border">
            <div className="text-xs font-bold text-text-primary mb-1">{t("projects.applied_deductions_label")}</div>
            {(project.deductDoors || 0) > 0 && (
              <div className="flex justify-between text-xs text-text-secondary pl-2">
                <span>• {project.deductDoors} {t("projects.door_deduction_item")}</span>
                <span className="font-bold text-error">-{doorsDeduction.toFixed(1)} m²</span>
              </div>
            )}
            {(project.deductWindows || 0) > 0 && (
              <div className="flex justify-between text-xs text-text-secondary pl-2">
                <span>• {project.deductWindows} {t("projects.window_deduction_item")}</span>
                <span className="font-bold text-error">-{windowsDeduction.toFixed(1)} m²</span>
              </div>
            )}
            {(project.customSubtractions || 0) > 0 && (
              <div className="flex justify-between text-xs text-text-secondary pl-2">
                <span>• {t("projects.other_obst_item")}</span>
                <span className="font-bold text-error">-{customDeductions.toFixed(1)} m²</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-text-primary pl-2 pt-1 border-t border-border/50">
              <span>{t("projects.total_deductions_label")}</span>
              <span className="text-error">-{totalDeductions.toFixed(2)} m²</span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-bg-surface-light border border-border text-[11px] text-text-secondary text-center italic">
            {t("projects.no_deductions_msg")}
          </div>
        )}

        <div className="flex justify-between items-center text-sm font-bold text-text-primary pt-3 border-t border-border">
          <span>{t("projects.net_area_label")}</span>
          <span className="text-primary">{project.area.toFixed(2)} m²</span>
        </div>

        <div className="space-y-1 pt-2 border-t border-dashed border-border text-xs text-text-secondary">
          <div className="flex justify-between">
            <span>{t("projects.laying_pattern_item")}</span>
            <span className="font-bold text-text-primary capitalize">{patternValue}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("projects.waste_percent_item")}</span>
            <span className="font-bold text-text-primary">+{project.wastePercent || 10}%</span>
          </div>
          <div className="flex justify-between">
            <span>{t("projects.base_material_item")}</span>
            <span className="font-bold text-text-primary capitalize">{materialValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProjectSuggestedSectionProps {
  suggestedProducts: Product[];
  catSlug: string;
  t: (k: string) => string;
}

function ProjectSuggestedSection({
  suggestedProducts,
  catSlug,
  t,
}: Readonly<ProjectSuggestedSectionProps>) {
  if (suggestedProducts.length === 0) return null;

  return (
    <section className="border-t border-border pt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            {t("projects.suggested_products_title")}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {t("projects.suggested_products_desc")}
          </p>
        </div>
        <Button variant="outline" href={`/catalogo?cat=${catSlug}`} size="sm">
          {t("projects.view_all_btn")}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {suggestedProducts.map((p: Product) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function ProjectDetailPage({ params }: Readonly<ProjectDetailPageProps>) {
  const { id } = use(params);
  const { t } = useLanguage();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.get(`/api/v1/projects/${id}`);
        if (res.success && res.data) {
          setProject(res.data);
          
          const cat = res.data.materialType === "pintura" ? "pinturas" : "pisos-ceramicas";
          const suggestedRes = await api.get(`/api/v1/products?category=${cat}&limit=4`);
          if (suggestedRes.success && suggestedRes.data) {
            setSuggestedProducts(suggestedRes.data);
          }
        }
      } catch (err) {
        console.error("Error loading project details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-text-secondary">
        {t("projects.loading_projects")}
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  const materials = project.materials || [];
  const statusLower = project.status?.toLowerCase();
  const statusVariant = getStatusVariant(statusLower);
  const catSlug = project.materialType === "pintura" ? "pinturas" : "pisos-ceramicas";
  const grossArea = calculateGrossArea(project);
  const statusLabel = t("status." + statusLower);

  const projectTypes: Record<string, string> = {
    PISO: t("projects.surface_floor"),
    PARED: t("projects.surface_walls"),
    TECHO: t("projects.surface_ceiling"),
    INTEGRAL: t("projects.surface_integral"),
  };
  const typeLabel = projectTypes[project.type] || project.type;

  const layingPatterns: Record<string, string> = {
    directo: t("projects.pattern_direct"),
    trabadura: t("projects.pattern_cross"),
    diagonal: t("projects.pattern_diagonal"),
  };
  const patternKey = project.layingPattern?.toLowerCase() || "";
  const patternValue = layingPatterns[patternKey] || project.layingPattern || t("projects.pattern_direct");

  const coveringTypes: Record<string, string> = {
    ceramica: t("projects.surface_ceramica"),
    porcelanato: t("projects.surface_porcelanato"),
    madera: t("projects.surface_madera"),
    vinilo: t("projects.surface_vinilo"),
    pintura: t("projects.supply_paint"),
  };
  const materialKey = project.materialType?.toLowerCase() || "";
  const materialValue = coveringTypes[materialKey] || project.materialType || "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8" aria-label="Breadcrumb">
        <Link href="/proyectos" className="hover:text-primary transition-colors">
          {t("projects.my_projects")}
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="text-4xl text-primary/80 flex items-center bg-primary/5 p-2 rounded-xl">
            <LucideIcon name={project.thumbnail} size={40} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              {project.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={statusVariant}>
                {statusLabel}
              </Badge>
              <span className="text-sm text-text-muted">
                {t("projects.created_on")}{" "}
                {new Date(project.createdAt).toLocaleDateString(t("locale"), {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
        <ProjectActions projectId={id} projectName={project.name} currentStatus={project.status} />
      </div>

      {/* Project General Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: t("projects.superficie_label"), value: typeLabel, icon: "ClipboardList" },
          { label: t("projects.area_intervention_label"), value: `${project.area.toFixed(2)} m²`, icon: "Maximize2" },
          { label: t("projects.estimated_supplies_label"), value: `${materials.length} ${t("projects.materials")}`, icon: "Package" },
          { label: t("projects.purchase_budget_label"), value: formatPrice(project.estimatedCost), icon: "DollarSign" },
        ].map((info) => (
          <div
            key={info.label}
            className="bg-bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[110px]"
          >
            <div className="text-primary/85 mb-2 flex items-center">
              <LucideIcon name={info.icon} size={26} />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">{info.value}</p>
              <p className="text-xs text-text-secondary mt-0.5 font-medium">{info.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Side: Materials List Editor */}
        <div className="lg:col-span-8">
          <MaterialsListEditor
            projectId={id}
            initialMaterials={materials}
            wastePercent={project.wastePercent || 10}
            catSlug={catSlug}
          />
        </div>

        {/* Right Side: Calculation Precision Sheet */}
        <div className="lg:col-span-4 space-y-6">
          <ProjectSpecSheet
            project={project}
            grossArea={grossArea}
            patternValue={patternValue}
            materialValue={materialValue}
            t={t}
          />
        </div>
      </div>

      {/* Suggested Products Section */}
      <ProjectSuggestedSection
        suggestedProducts={suggestedProducts}
        catSlug={catSlug}
        t={t}
      />
    </div>
  );
}

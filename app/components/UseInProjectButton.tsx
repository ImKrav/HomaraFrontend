"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/app/lib/api";
import { showToast } from "@/app/lib/toast";
import Button from "./ui/Button";
import LucideIcon from "./ui/LucideIcon";
import { Project } from "@/app/lib/utils";
import { useLanguage } from "@/app/context/LanguageContext";

interface UseInProjectButtonProps {
  productId: string;
  productName: string;
  categorySlug: string;
}

export default function UseInProjectButton({
  productId,
  productName,
  categorySlug,
}: UseInProjectButtonProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Mapeo inteligente del producto al materialType del proyecto
  const getMaterialTypeForProduct = (): string | null => {
    const nameLower = productName.toLowerCase();
    if (categorySlug === "pinturas" || nameLower.includes("pintura")) {
      return "pintura";
    }
    if (nameLower.includes("porcelanato")) {
      return "porcelanato";
    }
    if (
      nameLower.includes("madera") ||
      nameLower.includes("laminado") ||
      nameLower.includes("nogal") ||
      nameLower.includes("teka") ||
      nameLower.includes("haya")
    ) {
      return "madera";
    }
    if (nameLower.includes("vinil") || nameLower.includes("spc") || nameLower.includes("pvc")) {
      return "vinilo";
    }
    if (nameLower.includes("ceramica") || nameLower.includes("baldosa") || nameLower.includes("mármol")) {
      return "ceramica";
    }
    return null;
  };

  // Carga de proyectos al abrir el modal
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      async function fetchProjects() {
        try {
          setLoadingProjects(true);
          const response = await api.get("/api/v1/projects");
          if (response.success && response.data) {
            setProjects(response.data);
          }
        } catch (error) {
          console.error("Error al cargar proyectos:", error);
          showToast(t("projects.assign_error_fetch"), "error");
        } finally {
          setLoadingProjects(false);
        }
      }
      fetchProjects();
    }
  }, [isOpen, isAuthenticated, t]);

  const handleAssign = async () => {
    if (!selectedProjectId) return;
    
    try {
      setSubmitting(true);
      const updateData: { selectedProductId: string; materialType?: string } = {
        selectedProductId: productId,
      };

      const detectedMaterialType = getMaterialTypeForProduct();
      if (detectedMaterialType) {
        updateData.materialType = detectedMaterialType;
      }

      const response = await api.put(`/api/v1/projects/${selectedProjectId}`, updateData);

      if (response.success) {
        showToast(t("projects.assign_success"), "success");
        setIsOpen(false);
        router.refresh();
        window.location.href = `/proyectos/${selectedProjectId}`;
      } else {
        showToast(response.error || t("projects.assign_error_submit"), "error");
      }
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : t("projects.assign_error_conn");
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Traducción de tipo de proyecto
  const projectTypes: Record<string, string> = useMemo(() => ({
    PISO: t("projects.surface_floor"),
    PARED: t("projects.surface_walls"),
    TECHO: t("projects.surface_ceiling"),
    INTEGRAL: t("projects.surface_integral"),
  }), [t]);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto"
      >
        {t("projects.assign_btn")}
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-bg-surface border border-border w-full max-w-lg p-6 sm:p-8 shadow-xl animate-scale-in z-10 flex flex-col max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <LucideIcon name="X" size={20} />
            </button>

            {/* Content for Unauthenticated user */}
            {!isAuthenticated ? (
              <div className="text-center py-6 flex flex-col items-center">
                <div className="h-14 w-14 rounded-none bg-primary/5 flex items-center justify-center text-primary mb-4">
                  <LucideIcon name="Maximize2" size={28} />
                </div>
                <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight mb-2">
                  {t("projects.assign_login_title")}
                </h3>
                <p className="text-text-secondary text-sm max-w-sm mb-6 leading-relaxed">
                  {t("projects.assign_login_desc")}
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      router.push(`/login?redirect=/catalogo/${productId}`);
                    }}
                    fullWidth
                  >
                    {t("projects.assign_login_btn")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/register");
                    }}
                    fullWidth
                  >
                    {t("projects.assign_register_btn")}
                  </Button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-text-muted hover:text-text-primary uppercase tracking-wider font-bold mt-2 cursor-pointer"
                  >
                    {t("projects.assign_cancel_btn")}
                  </button>
                </div>
              </div>
            ) : (
              /* Content for Authenticated user */
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg-surface-light border border-border text-[9px] uppercase tracking-wider font-bold mb-3 text-text-muted">
                    <span className="h-1.5 w-1.5 bg-primary" />
                    {t("projects.assign_badge")}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight">
                    {t("projects.assign_title")}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {t("projects.assign_desc").replace("{product}", productName)}
                  </p>
                </div>

                {loadingProjects ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-text-secondary text-sm gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                    <span>{t("projects.assign_loading")}</span>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-none bg-primary/5 flex items-center justify-center text-text-muted mb-3">
                      <LucideIcon name="Folder" size={24} />
                    </div>
                    <p className="text-sm font-bold text-text-primary uppercase mb-1">
                      {t("projects.assign_empty_title")}
                    </p>
                    <p className="text-xs text-text-secondary max-w-xs mb-6">
                      {t("projects.assign_empty_desc")}
                    </p>
                    <div className="flex flex-col gap-3 w-full">
                      <Button
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/proyectos/nuevo?selectedProductId=${productId}`);
                        }}
                        fullWidth
                      >
                        {t("projects.assign_empty_btn")}
                      </Button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-xs text-text-muted hover:text-text-primary uppercase tracking-wider font-bold mt-1 cursor-pointer"
                      >
                        {t("projects.assign_cancel_btn")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Projects List Container */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-6 scrollbar-thin max-h-[300px]">
                      {projects.map((project) => {
                        const isSelected = selectedProjectId === project.id;
                        const statusClass =
                          project.status?.toLowerCase() === "completado"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                            : project.status?.toLowerCase() === "en_progreso"
                            ? "bg-amber-50 text-amber-700 border-amber-200/50"
                            : "bg-sky-50 text-sky-700 border-sky-200/50";
                            
                        const statusLabel = t("status." + project.status?.toLowerCase());

                        return (
                          <div
                            key={project.id}
                            onClick={() => setSelectedProjectId(project.id)}
                            className={`flex items-center justify-between p-3 border cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? "bg-primary/5 border-primary shadow-sm"
                                : "bg-bg-surface border-border hover:border-text-muted"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl select-none">
                                {project.thumbnail || "🏠"}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-text-primary uppercase tracking-tight">
                                  {project.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-text-secondary">
                                  <span className="uppercase font-semibold tracking-wider">
                                    {projectTypes[project.type] || project.type}
                                  </span>
                                  <span>•</span>
                                  <span>{project.area} m²</span>
                                  <span>•</span>
                                  <span className={`px-1.5 py-0.5 border text-[8px] font-bold uppercase ${statusClass}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Checkmark indicator */}
                            <div
                              className={`h-5 w-5 rounded-none flex items-center justify-center border transition-all ${
                                isSelected
                                  ? "bg-primary border-primary text-bg-base"
                                  : "border-border text-transparent"
                              }`}
                            >
                              <LucideIcon name="Check" size={14} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={handleAssign}
                        disabled={!selectedProjectId || submitting}
                        fullWidth
                      >
                        {submitting ? t("projects.assign_submitting") : t("projects.assign_confirm_btn")}
                      </Button>
                      
                      <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                          <span className="bg-bg-surface px-3 text-text-muted">{t("projects.assign_divider_text")}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/proyectos/nuevo?selectedProductId=${productId}`);
                        }}
                        fullWidth
                      >
                        {t("projects.assign_new_proj_btn")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { api } from "@/app/lib/api";
import { showToast } from "@/app/lib/toast";
import { useLanguage } from "@/app/context/LanguageContext";

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  stockQuantity: number;
}

interface ProjectData {
  name: string;
  type: string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  area: number;
  materialType?: string | null;
  tileFormat?: string | null;
  wastePercent?: number | null;
  layingPattern?: string | null;
  deductDoors?: number | null;
  deductWindows?: number | null;
  customSubtractions?: number | null;
  includeAdhesive?: boolean | null;
  includeGrout?: boolean | null;
  includeSpacers?: boolean | null;
  includeTools?: boolean | null;
  selectedProductId?: string | null;
}

function NuevoProyectoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"dimensions" | "precision" | "materials" | "accessories">("dimensions");

  // Campos básicos
  const [name, setName] = useState("");
  const [type, setType] = useState("piso");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [materialType, setMaterialType] = useState("ceramica");
  const [tileFormat, setTileFormat] = useState("60x60");

  // Nuevos campos de personalización y precisión
  const [layingPattern, setLayingPattern] = useState("directo");
  const [wastePercent, setWastePercent] = useState<number>(10);
  const [deductDoors, setDeductDoors] = useState("0");
  const [deductWindows, setDeductWindows] = useState("0");
  const [customSubtractions, setCustomSubtractions] = useState("0");

  // Inclusión de accesorios
  const [includeAdhesive, setIncludeAdhesive] = useState(true);
  const [includeGrout, setIncludeGrout] = useState(true);
  const [includeSpacers, setIncludeSpacers] = useState(true);
  const [includeTools, setIncludeTools] = useState(true);

  // Selección de producto real del catálogo
  const [selectedProductId, setSelectedProductId] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);

  // Precargar datos si estamos en modo edición
  useEffect(() => {
    if (editId) {
      const fetchProject = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/api/v1/projects/${editId}`);
          if (res.success && res.data) {
            const p = res.data as ProjectData;
            setName(p.name || "");
            setType(p.type?.toLowerCase() || "piso");
            setLength(p.length?.toString() || "");
            setWidth(p.width?.toString() || "");
            setHeight(p.height?.toString() || "");
            setMaterialType(p.materialType || "ceramica");
            setTileFormat(p.tileFormat || "60x60");
            setWastePercent(p.wastePercent !== undefined && p.wastePercent !== null ? p.wastePercent : 10);
            setLayingPattern(p.layingPattern || "directo");
            setDeductDoors(p.deductDoors?.toString() || "0");
            setDeductWindows(p.deductWindows?.toString() || "0");
            setCustomSubtractions(p.customSubtractions?.toString() || "0");
            setIncludeAdhesive(p.includeAdhesive !== false);
            setIncludeGrout(p.includeGrout !== false);
            setIncludeSpacers(p.includeSpacers !== false);
            setIncludeTools(p.includeTools !== false);
            setSelectedProductId(p.selectedProductId || "");
          }
        } catch (err: unknown) {
          console.error(err);
          showToast(t("projects.error_loading_data"), "error");
        } finally {
          setLoading(false);
        }
      };
      fetchProject();
    }
  }, [editId, language, t]);

  // Resetear deducciones de puertas y ventanas si es piso o techo
  useEffect(() => {
    if (type === "piso" || type === "techo") {
      setDeductDoors("0");
      setDeductWindows("0");
    }
  }, [type]);

  // Cargar productos del catálogo según el materialType seleccionado
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setFetchingProducts(true);
        const cat = materialType === "pintura" ? "pinturas" : "pisos-ceramicas";
        const res = await api.get(`/api/v1/products?category=${cat}`);
        if (res.success && res.data) {
          setCatalogProducts(res.data as CatalogProduct[]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setFetchingProducts(false);
      }
    };
    fetchProducts();
  }, [materialType]);

  // Filtrar productos del catálogo reactivamente según el tipo exacto seleccionado
  const filteredCatalogProducts = useMemo(() => {
    if (materialType === "pintura") {
      return catalogProducts.filter((p) => p.name.toLowerCase().includes("pintura"));
    }
    return catalogProducts.filter((p) => {
      const nameLower = p.name.toLowerCase();
      if (materialType === "ceramica") {
        return (nameLower.includes("cerámica") || nameLower.includes("ceramica") || nameLower.includes("baldosa")) && !nameLower.includes("porcelanato");
      }
      if (materialType === "porcelanato") {
        return nameLower.includes("porcelanato");
      }
      if (materialType === "madera") {
        return nameLower.includes("madera") || nameLower.includes("laminado") || nameLower.includes("laminada");
      }
      if (materialType === "vinilo") {
        return nameLower.includes("vinilo") || nameLower.includes("pvc") || nameLower.includes("spc");
      }
      return true;
    });
  }, [catalogProducts, materialType]);

  // Auto-seleccionar primer producto filtrado si la selección actual ya no es válida para este tipo
  useEffect(() => {
    if (!editId && filteredCatalogProducts.length > 0) {
      const isStillAvailable = filteredCatalogProducts.some((p) => p.id === selectedProductId);
      if (!isStillAvailable) {
        setSelectedProductId(filteredCatalogProducts[0].id);
      }
    } else if (!editId && filteredCatalogProducts.length === 0) {
      setSelectedProductId("");
    }
  }, [filteredCatalogProducts, editId, selectedProductId]);

  // Manejar el cambio automático de desperdicio al cambiar de patrón
  const handlePatternChange = (pattern: string) => {
    setLayingPattern(pattern);
    if (materialType === "pintura") {
      setWastePercent(5);
    } else {
      if (pattern === "directo") setWastePercent(10);
      else if (pattern === "diagonal") setWastePercent(15);
      else if (pattern === "trabadura") setWastePercent(12);
    }
  };

  // Cálculo en tiempo real de dimensiones, deducciones y desperdicios
  const areaDetails = useMemo(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;

    let grossArea = 0;
    if (type === "piso" || type === "techo") {
      grossArea = l * w;
    } else if (type === "pared") {
      grossArea = w > 0 ? (l + w) * 2 * h : l * h;
    } else if (type === "integral") {
      grossArea = (l * w) + ((l + w) * 2 * h);
    }

    const doorsArea = (parseInt(deductDoors) || 0) * 2.0;
    const windowsArea = (parseInt(deductWindows) || 0) * 1.5;
    const customArea = parseFloat(customSubtractions) || 0;
    
    const totalDeductions = doorsArea + windowsArea + customArea;
    const netArea = Math.max(0.1, grossArea - totalDeductions);
    const wasteAmount = netArea * (wastePercent / 100);
    const finalArea = netArea + wasteAmount;

    return {
      grossArea,
      totalDeductions,
      netArea,
      wasteAmount,
      finalArea,
    };
  }, [type, length, width, height, deductDoors, deductWindows, customSubtractions, wastePercent]);

  // Guardar proyecto (Crear o Actualizar)
  const handleSaveProject = async () => {
    let isValid = true;
    let missingFieldsMessage = "";

    if (!name) {
      isValid = false;
      missingFieldsMessage = "Nombre del proyecto";
    } else if (!length) {
      isValid = false;
      missingFieldsMessage = "Largo";
    } else if ((type === "piso" || type === "techo") && !width) {
      isValid = false;
      missingFieldsMessage = "Ancho";
    } else if (type === "pared" && !height) {
      isValid = false;
      missingFieldsMessage = "Alto";
    } else if (type === "integral" && (!width || !height)) {
      isValid = false;
      missingFieldsMessage = !width ? "Ancho" : "Alto";
    }

    if (!isValid) {
      const fieldLabels: Record<string, string> = {
        "Nombre del proyecto": t("projects.descriptive_name_label"),
        "Largo": t("projects.length"),
        "Ancho": t("projects.width"),
        "Alto": t("projects.height")
      };
      const translatedField = fieldLabels[missingFieldsMessage] || missingFieldsMessage;
      showToast(
        t("projects.required_field_alert").replace("{field}", translatedField),
        "warning"
      );
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name,
        type: type.toUpperCase(), // "PISO", "PARED", "TECHO", "INTEGRAL"
        length: parseFloat(length) || null,
        width: parseFloat(width) || null,
        height: parseFloat(height) || null,
        area: areaDetails.netArea, // Enviamos el área neta al backend para cálculos físicos exactos
        materialType,
        tileFormat,
        wastePercent,
        layingPattern,
        deductDoors: parseInt(deductDoors) || 0,
        deductWindows: parseInt(deductWindows) || 0,
        customSubtractions: parseFloat(customSubtractions) || 0,
        includeAdhesive,
        includeGrout,
        includeSpacers,
        includeTools,
        selectedProductId: selectedProductId || null,
      };

      let res;
      if (editId) {
        res = await api.put(`/api/v1/projects/${editId}`, payload);
      } else {
        res = await api.post("/api/v1/projects", payload);
      }

      if (res.success && res.data) {
        showToast(
          editId ? t("projects.update_success") : t("projects.create_success"),
          "success"
        );
        router.refresh();
        window.location.href = `/proyectos/${res.data.id}`;
      } else {
        showToast(res.error || t("projects.process_error"), "error");
      }
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : t("projects.network_save_error");
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedProductDetails = useMemo(() => {
    return catalogProducts.find((p) => p.id === selectedProductId);
  }, [catalogProducts, selectedProductId]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            {editId ? t("projects.edit_estimator_title") : t("projects.new_estimator_title")}
          </h1>
          <p className="mt-2 text-text-secondary text-base">
            {t("projects.estimator_tagline")}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" href="/proyectos" disabled={loading}>
            {t("projects.cancel_btn")}
          </Button>
          <Button onClick={handleSaveProject} disabled={loading} size="md">
            {loading ? t("projects.calculating") : editId ? t("projects.save_changes") : t("projects.save_and_calculate")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel Formulario con Pestañas */}
        <div className="lg:col-span-8 space-y-6">
          {/* Navegación de Pestañas Premium */}
          <div className="bg-bg-surface border border-border flex p-1 divide-x divide-border">
            {[
              { id: "dimensions", label: t("projects.tab_space"), icon: "Maximize2" },
              { id: "precision", label: t("projects.tab_precision"), icon: "Scale" },
              { id: "materials", label: t("projects.tab_covering"), icon: "Grid" },
              { id: "accessories", label: t("projects.tab_accessories"), icon: "Hammer" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as "dimensions" | "precision" | "materials" | "accessories")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-1 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-light"
                }`}
              >
                <LucideIcon name={tab.icon} size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Contenido de Pestaña: Espacio y Tipo */}
          {activeTab === "dimensions" && (
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-2">
                  <LucideIcon name="Layers" className="text-primary" />
                  {t("projects.space_info_title")}
                </h2>
                <p className="text-sm text-text-secondary">{t("projects.space_info_desc")}</p>
              </div>

              <Input
                label={t("projects.descriptive_name_label")}
                placeholder={t("projects.descriptive_name_placeholder")}
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="space-y-3">
                <label className="text-sm font-bold text-text-primary">
                  {t("projects.surface_label")} <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: "piso", label: t("projects.surface_floor"), icon: "Layers" },
                    { value: "pared", label: t("projects.surface_walls"), icon: "BrickWall" },
                    { value: "techo", label: t("projects.surface_ceiling"), icon: "Home" },
                    { value: "integral", label: t("projects.surface_integral"), icon: "Hammer" },
                  ].map((tField) => (
                    <label
                      key={tField.value}
                      className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-center ${
                        type === tField.value
                          ? "border-primary bg-primary/5 shadow-md scale-102"
                          : "border-border hover:border-primary/45 hover:bg-bg-surface-light"
                      }`}
                    >
                      <input
                        type="radio"
                        name="project-type"
                        value={tField.value}
                        checked={type === tField.value}
                        onChange={(e) => {
                          setType(e.target.value);
                        }}
                        className="sr-only"
                      />
                      <div className="text-primary flex items-center justify-center h-8">
                        <LucideIcon name={tField.icon} size={28} />
                      </div>
                      <span className="text-sm text-text-primary font-bold">
                        {tField.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-primary mb-3">{t("projects.physical_dimensions_title")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label={t("projects.length_meters")}
                    type="number"
                    step="0.01"
                    placeholder="Ej: 4.5"
                    id="length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    required
                  />
                  <Input
                    label={type === "pared" ? t("projects.width_meters_optional") : t("projects.width_meters")}
                    type="number"
                    step="0.01"
                    placeholder="Ej: 3.2"
                    id="width"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    required={type !== "pared"}
                  />
                  <Input
                    label={type === "piso" || type === "techo" ? t("projects.height_meters_optional") : t("projects.height_meters")}
                    type="number"
                    step="0.01"
                    placeholder="Ej: 2.4"
                    id="height"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required={type === "pared" || type === "integral"}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Contenido de Pestaña: Deducciones de Precisión */}
          {activeTab === "precision" && (
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-2">
                  <LucideIcon name="Scale" className="text-primary" />
                  {t("projects.precision_title")}
                </h2>
                <p className="text-sm text-text-secondary">
                  {t("projects.precision_desc")}
                </p>
              </div>

              {type === "piso" || type === "techo" ? (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center text-xs text-text-secondary flex items-center justify-center gap-2">
                  <LucideIcon name="Info" className="text-primary" size={16} />
                  <span>
                    {t("projects.deduction_not_applicable")}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Puertas */}
                  <div className="p-4 bg-bg-surface-light rounded-lg border border-border flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <LucideIcon name="DoorOpen" className="text-primary" size={24} />
                      <div>
                        <h4 className="font-semibold text-text-primary text-sm">{t("projects.doors_label")}</h4>
                        <p className="text-xs text-text-muted">{t("projects.doors_desc")}</p>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={deductDoors}
                      onChange={(e) => setDeductDoors(e.target.value)}
                      className="w-16 text-center border border-border rounded p-1 bg-bg-surface text-text-primary"
                    />
                  </div>

                  {/* Ventanas */}
                  <div className="p-4 bg-bg-surface-light rounded-lg border border-border flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <LucideIcon name="Tv" className="text-primary" size={24} />
                      <div>
                        <h4 className="font-semibold text-text-primary text-sm">{t("projects.windows_label")}</h4>
                        <p className="text-xs text-text-muted">{t("projects.windows_desc")}</p>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={deductWindows}
                      onChange={(e) => setDeductWindows(e.target.value)}
                      className="w-16 text-center border border-border rounded p-1 bg-bg-surface text-text-primary"
                    />
                  </div>
                </div>
              )}

              <Input
                label={t("projects.custom_deductions_label")}
                type="number"
                step="0.1"
                placeholder={t("projects.custom_deductions_placeholder")}
                id="custom-subtractions"
                value={customSubtractions}
                onChange={(e) => setCustomSubtractions(e.target.value)}
              />

              <hr className="border-border" />

              <div>
                <h3 className="text-sm font-bold text-text-primary mb-3">{t("projects.laying_pattern_title")}</h3>
                <p className="text-xs text-text-secondary mb-4">
                  {t("projects.laying_pattern_desc")}
                </p>

                {materialType === "pintura" ? (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center text-xs text-text-secondary flex items-center justify-center gap-2 mb-6 animate-fade-in">
                    <LucideIcon name="Layers" className="text-primary" size={16} />
                    <span>
                      {t("projects.pattern_not_applicable")}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { value: "directo", label: t("projects.pattern_direct"), desc: t("projects.pattern_direct_desc") },
                      { value: "trabadura", label: t("projects.pattern_cross"), desc: t("projects.pattern_cross_desc") },
                      { value: "diagonal", label: t("projects.pattern_diagonal"), desc: t("projects.pattern_diagonal_desc") },
                    ].map((pat) => (
                      <button
                        key={pat.value}
                        type="button"
                        onClick={() => handlePatternChange(pat.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-center transition-all ${
                          layingPattern === pat.value
                            ? "border-primary bg-primary/5 font-bold"
                            : "border-border hover:border-primary/45 hover:bg-bg-surface-light text-text-secondary"
                        }`}
                      >
                        <span className="text-xs text-text-primary font-bold">{pat.label}</span>
                        <span className="text-[10px] text-text-muted">{pat.desc}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-text-primary">
                    <span>{t("projects.adjusted_waste_label")}</span>
                    <span className="text-primary font-bold">{wastePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={wastePercent}
                    onChange={(e) => setWastePercent(parseInt(e.target.value))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>{t("projects.waste_none")}</span>
                    <span>{t("projects.waste_standard")}</span>
                    <span>{t("projects.waste_complex")}</span>
                    <span>{t("projects.waste_maximum")}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Contenido de Pestaña: Material y Productos */}
          {activeTab === "materials" && (
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-2">
                  <LucideIcon name="Grid" className="text-primary" />
                  {t("projects.material_catalog_title")}
                </h2>
                <p className="text-sm text-text-secondary">
                  {t("projects.material_catalog_desc")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-text-primary">{t("projects.covering_type_label")}</label>
                  <select
                    className="bg-bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={materialType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setMaterialType(newType);
                      if (newType === "pintura") {
                        setWastePercent(5);
                        setLayingPattern("pintura");
                      } else {
                        setLayingPattern("directo");
                        setWastePercent(10);
                      }
                    }}
                  >
                    <option value="ceramica">{t("projects.surface_ceramica")}</option>
                    <option value="porcelanato">{t("projects.surface_porcelanato")}</option>
                    <option value="madera">{t("projects.surface_madera")}</option>
                    <option value="vinilo">{t("projects.surface_vinilo")}</option>
                    <option value="pintura">{t("projects.supply_paint")}</option>
                  </select>
                </div>

                {materialType !== "pintura" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-text-primary">{t("projects.tile_format_label")}</label>
                    <select
                      className="bg-bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={tileFormat}
                      onChange={(e) => setTileFormat(e.target.value)}
                    >
                      <option value="60x60">60 x 60 cm ({t("projects.tile_formats.large")})</option>
                      <option value="45x45">45 x 45 cm ({t("projects.tile_formats.medium")})</option>
                      <option value="30x60">30 x 60 cm ({t("projects.tile_formats.rectangular")})</option>
                      <option value="20x60">20 x 60 cm ({t("projects.tile_formats.plank")})</option>
                      <option value="80x80">80 x 80 cm ({t("projects.tile_formats.extra_large")})</option>
                      <option value="100x100">100 x 100 cm ({t("projects.tile_formats.super_extra_large")})</option>
                      <option value="15x90">15 x 90 cm ({t("projects.tile_formats.wood_strip")})</option>
                      <option value="30x30">30 x 30 cm ({t("projects.tile_formats.mosaic")})</option>
                      <option value="10x20">10 x 20 cm ({t("projects.tile_formats.subway")})</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Selector de Producto Real del Catálogo */}
              <div className="border border-border p-4 bg-bg-surface-light rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <LucideIcon name="ShoppingBag" className="text-primary" size={18} />
                  {t("projects.link_product_title")}
                </h3>
                <p className="text-xs text-text-secondary">
                  {t("projects.link_product_desc")}
                </p>

                {fetchingProducts ? (
                  <div className="py-6 text-center text-sm text-text-muted flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    {t("projects.loading_store_products")}
                  </div>
                ) : filteredCatalogProducts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-text-muted">
                    {t("projects.no_products_found")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto">
                      {filteredCatalogProducts.map((p) => (
                        <label
                          key={p.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-bg-surface transition-all ${
                            selectedProductId === p.id
                              ? "border-primary bg-primary/5 shadow-sm font-semibold"
                              : "border-border bg-bg-surface text-text-secondary"
                          }`}
                        >
                          <input
                            type="radio"
                            name="catalog-product"
                            value={p.id}
                            checked={selectedProductId === p.id}
                            onChange={() => setSelectedProductId(p.id)}
                            className="sr-only"
                          />
                          <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center">
                            {selectedProductId === p.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate">{p.name}</p>
                            <p className="text-[10px] text-text-muted">
                              {t("projects.sales_unit")}: <span className="font-bold text-primary">{t("admin.units.abbr_" + p.unit) === ("admin.units.abbr_" + p.unit) ? p.unit : t("admin.units.abbr_" + p.unit)}</span> | {t("projects.stock_count")}: {p.stockQuantity}
                            </p>
                          </div>
                          <div className="text-right text-xs font-extrabold text-text-primary">
                            ${p.price.toLocaleString(t("locale"))}/{t("admin.units.abbr_" + p.unit) === ("admin.units.abbr_" + p.unit) ? p.unit : t("admin.units.abbr_" + p.unit)}
                          </div>
                        </label>
                      ))}
                    </div>

                    {selectedProductDetails && (
                      <div className="mt-4 p-4 border border-primary/20 bg-primary/5 rounded-lg flex items-center gap-4">
                        <div className="text-2xl text-primary">👍</div>
                        <div>
                          <p className="text-xs text-text-primary font-bold">{t("projects.excellent_choice")}</p>
                          <p className="text-xs text-text-secondary">
                            {t("projects.excellent_choice_desc")
                              .replace("{name}", selectedProductDetails.name)
                              .replace("{price}", `${selectedProductDetails.price.toLocaleString(t("locale"))} COP`)
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Contenido de Pestaña: Accesorios de Instalación */}
          {activeTab === "accessories" && (
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-2">
                  <LucideIcon name="Hammer" className="text-primary" />
                  {t("projects.accessories_tools_title")}
                </h2>
                <p className="text-sm text-text-secondary">
                  {t("projects.accessories_tools_desc")}
                </p>
              </div>

              <div className="space-y-3">
                {materialType !== "pintura" && (
                  <>
                    <label className="flex items-center gap-3 p-4 bg-bg-surface-light border border-border rounded-lg cursor-pointer hover:bg-bg-surface transition-colors">
                      <input
                        type="checkbox"
                        checked={includeAdhesive}
                        onChange={(e) => setIncludeAdhesive(e.target.checked)}
                        className="w-4 h-4 text-primary bg-bg-surface border-border rounded focus:ring-primary focus:ring-2"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-text-primary block">{t("projects.adhesives_label")}</span>
                        <span className="text-xs text-text-muted">{t("projects.adhesives_desc")}</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-bg-surface-light border border-border rounded-lg cursor-pointer hover:bg-bg-surface transition-colors">
                      <input
                        type="checkbox"
                        checked={includeGrout}
                        onChange={(e) => setIncludeGrout(e.target.checked)}
                        className="w-4 h-4 text-primary bg-bg-surface border-border rounded focus:ring-primary focus:ring-2"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-text-primary block">{t("projects.grout_label")}</span>
                        <span className="text-xs text-text-muted">{t("projects.grout_desc")}</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-bg-surface-light border border-border rounded-lg cursor-pointer hover:bg-bg-surface transition-colors">
                      <input
                        type="checkbox"
                        checked={includeSpacers}
                        onChange={(e) => setIncludeSpacers(e.target.checked)}
                        className="w-4 h-4 text-primary bg-bg-surface border-border rounded focus:ring-primary focus:ring-2"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-text-primary block">{t("projects.spacers_label")}</span>
                        <span className="text-xs text-text-muted">{t("projects.spacers_desc")}</span>
                      </div>
                    </label>
                  </>
                )}

                <label className="flex items-center gap-3 p-4 bg-bg-surface-light border border-border rounded-lg cursor-pointer hover:bg-bg-surface transition-colors">
                  <input
                    type="checkbox"
                    checked={includeTools}
                    onChange={(e) => setIncludeTools(e.target.checked)}
                    className="w-4 h-4 text-primary bg-bg-surface border-border rounded focus:ring-primary focus:ring-2"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-text-primary block">{t("projects.tools_kit_label")}</span>
                    <span className="text-xs text-text-muted">
                      {materialType === "pintura"
                        ? t("projects.tools_kit_paint_desc")
                        : t("projects.tools_kit_tile_desc")}
                    </span>
                  </div>
                </label>
              </div>
            </Card>
          )}
        </div>

        {/* Panel Lateral: Vista Previa y Resumen en Vivo */}
        <div className="lg:col-span-4">
          <div className="bg-bg-surface border border-border p-6 rounded-none sticky top-24 space-y-6 hover:shadow-md transition-shadow">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <LucideIcon name="PieChart" className="text-primary" />
                {t("projects.measurement_summary")}
              </h2>
            </div>

            {/* Ficha Técnica de Área */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm text-text-secondary">
                <span>{t("projects.gross_area_label")}</span>
                <span className="font-bold text-text-primary">{areaDetails.grossArea.toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between items-center text-sm text-text-secondary">
                <span>{t("projects.deductions_label")}</span>
                <span className="font-bold text-error">-{areaDetails.totalDeductions.toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-text-primary pt-2 border-t border-dashed border-border">
                <span>{t("projects.net_area_label")}</span>
                <span className="text-primary">{areaDetails.netArea.toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between items-center text-sm text-text-secondary">
                <span>{t("projects.waste_percent_label")} (+{wastePercent}%):</span>
                <span className="font-bold text-text-primary">+{areaDetails.wasteAmount.toFixed(2)} m²</span>
              </div>
            </div>

            {/* Placa Indicadora Principal de Área */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
              <span className="text-xs font-bold text-text-secondary block mb-1">{t("projects.total_material_needed")}</span>
              <span className="text-3xl font-extrabold text-primary tracking-tight">
                {areaDetails.finalArea.toFixed(1)} m²
              </span>
              <span className="text-[10px] text-text-muted block mt-1">{t("projects.calculated_waste_desc")}</span>
            </div>

            {/* Sugerencias de Insumos según selecciones */}
            <div className="text-xs space-y-2 bg-bg-surface-light p-3 rounded-lg border border-border text-text-secondary">
              <p className="font-bold text-text-primary mb-1.5 flex items-center gap-1">
                <LucideIcon name="Lightbulb" className="text-primary" size={14} />
                {t("projects.supplies_included_title")}
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t("projects.supply_main_material")} {materialType !== "pintura" ? `(${t("projects.supply_format")}: ${tileFormat})` : `(${t("projects.supply_paint")})`}</li>
                {materialType !== "pintura" && includeAdhesive && <li>{t("projects.supply_adhesive")}</li>}
                {materialType !== "pintura" && includeGrout && <li>{t("projects.supply_grout")}</li>}
                {materialType !== "pintura" && includeSpacers && <li>{t("projects.supply_spacers")}</li>}
                {includeTools && <li>{t("projects.supply_tools")}</li>}
              </ul>
            </div>

            {/* Acción de Guardado y Recalcular */}
            <div className="pt-2">
              <Button onClick={handleSaveProject} disabled={loading} size="lg" fullWidth>
                {loading ? t("projects.calculating") : editId ? t("projects.recalculate_btn") : t("projects.calculate_btn")}
              </Button>
              <p className="text-[10px] text-text-muted text-center mt-2.5 leading-relaxed">
                {t("projects.engineering_disclaimer")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NuevoProyectoPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-text-secondary">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        {t("projects.loading_form")}
      </div>
    }>
      <NuevoProyectoContent />
    </Suspense>
  );
}

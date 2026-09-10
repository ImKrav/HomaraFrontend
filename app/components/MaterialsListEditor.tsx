"use client";

import { useState, useMemo } from "react";
import { api } from "@/app/lib/api";
import { showToast } from "@/app/lib/toast";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatPrice, translateMaterialName, translateMaterialNote } from "@/app/lib/utils";
import LucideIcon from "./ui/LucideIcon";
import Button from "./ui/Button";
import AddToCartButton from "./AddToCartButton";

export interface ProjectMaterial {
  id?: string;
  name: string;
  quantity: string;
  note: string | null;
  icon: string;
  price: number;
  productId?: string | null;
}

interface MaterialsListEditorProps {
  projectId: string;
  initialMaterials: ProjectMaterial[];
  wastePercent: number;
  catSlug: string;
}

const QUANTITY_REGEX = /^([\d.,]+)(?:\s+(.*))?$/;

// Función de utilidad para parsear cantidades como "7 bultos", "27.5 m²" o "1 unidad"
function parseQuantity(quantityStr: string) {
  const match = QUANTITY_REGEX.exec(quantityStr.trim());
  if (!match) return { num: 1, unit: quantityStr };
  
  const numStr = match[1].replace(",", ".");
  const num = Number.parseFloat(numStr) || 1;
  const unit = match[2] ?? "";
  return { num, unit };
}

export default function MaterialsListEditor({
  projectId,
  initialMaterials,
  wastePercent,
  catSlug,
}: Readonly<MaterialsListEditorProps>) {
  const { t } = useLanguage();
  const [materials, setMaterials] = useState<ProjectMaterial[]>(initialMaterials);
  const [loading, setLoading] = useState(false);

  // Calcular el costo total en tiempo real
  const totalCost = useMemo(() => {
    return materials.reduce((sum, m) => sum + m.price, 0);
  }, [materials]);

  // Sincronizar la lista de materiales con el Backend
  const syncWithBackend = async (updatedList: ProjectMaterial[]) => {
    try {
      setLoading(true);
      const payload = {
        materials: updatedList.map((m) => ({
          name: m.name,
          quantity: m.quantity,
          note: m.note || null,
          icon: m.icon,
          price: m.price,
          productId: m.productId || null,
        })),
      };

      const res = await api.put(`/api/v1/projects/${projectId}`, payload);

      if (res.success && res.data) {
        if (res.data.materials) {
          setMaterials(res.data.materials);
        }
      } else {
        showToast(res.error || "Error al actualizar materiales.", "error");
      }
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Error de red al actualizar.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Modificar cantidad (incremento/decremento o cambio directo)
  const updateQuantityValue = async (index: number, newNum: number) => {
    if (newNum <= 0) {
      deleteMaterial(index);
      return;
    }

    const mat = materials[index];
    const { num: currentNum, unit } = parseQuantity(mat.quantity);
    
    // Calcular el precio unitario implícito
    const unitPrice = mat.price / (currentNum || 1);
    
    // Redondear el número a 2 decimales
    const roundedNum = Math.round(newNum * 100) / 100;
    const newPrice = Math.round(roundedNum * unitPrice);

    const updated = [...materials];
    updated[index] = {
      ...mat,
      quantity: `${roundedNum} ${unit}`.trim(),
      price: newPrice,
    };

    setMaterials(updated); // Actualización optimista de UI
    await syncWithBackend(updated);
  };

  // Eliminar material
  const deleteMaterial = async (index: number) => {
    const mat = materials[index];
    if (!confirm(t("projects.editor_remove_material_confirm").replace("{name}", translateMaterialName(mat.name, t)))) {
      return;
    }
    const updated = materials.filter((_, i) => i !== index);
    setMaterials(updated);
    await syncWithBackend(updated);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Advertencia sobre Recálculos */}
      <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-xl flex items-start gap-3">
        <div className="text-amber-600 mt-0.5 shrink-0">
          <LucideIcon name="Layers" size={20} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">
            {t("projects.editor_title")}
          </h4>
          <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
            {t("projects.editor_desc")}
          </p>
        </div>
      </div>

      <div className="bg-bg-surface rounded-xl border border-border overflow-hidden">
        {/* Header del Desglose */}
        <div className="p-5 border-b border-border bg-bg-surface-light flex justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {t("projects.editor_detailed_breakdown")}
            </h2>
            <span className="text-xs font-semibold text-text-secondary">
              {t("projects.editor_waste_included").replace("{waste}", String(wastePercent || 10))}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            href={`/catalogo?cat=${catSlug}`}
            className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold shadow-sm"
          >
            <LucideIcon name="Plus" size={14} />
            {t("projects.editor_add_material")}
          </Button>
        </div>

        {/* Lista de Insumos */}
        <div className="divide-y divide-border">
          {materials.length === 0 && (
            <div className="p-12 text-center text-sm text-text-secondary italic">
              {t("projects.editor_no_materials")}
            </div>
          )}

          {materials.map((mat, index) => {
            const { num, unit } = parseQuantity(mat.quantity);

            return (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-bg-surface-light transition-colors group"
              >
                {/* Info & Icono */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="text-primary/80 flex items-center justify-center w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 select-none">
                    <LucideIcon name={mat.icon} size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-text-primary truncate">
                      {translateMaterialName(mat.name, t)}
                    </p>
                    {mat.note && (
                      <p className="text-xs text-text-secondary mt-0.5 truncate">
                        {translateMaterialNote(mat.note, t)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ajuste de Cantidad y Costo */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                  
                  {/* Selector de Cantidades +/- y numérico */}
                  <div className="flex items-center gap-1 bg-border/20 px-2 py-1 rounded h-9">
                    <button
                      onClick={() => updateQuantityValue(index, num - 1)}
                      disabled={loading}
                      title={t("projects.editor_reduce_qty")}
                      className="w-6 h-6 flex items-center justify-center font-black text-text-secondary hover:text-primary transition-colors cursor-pointer select-none disabled:opacity-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={num}
                      onChange={(e) => updateQuantityValue(index, Number.parseFloat(e.target.value) || 0)}
                      disabled={loading}
                      className="w-12 bg-transparent text-center font-extrabold text-xs text-text-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => updateQuantityValue(index, num + 1)}
                      disabled={loading}
                      title={t("projects.editor_increase_qty")}
                      className="w-6 h-6 flex items-center justify-center font-black text-text-secondary hover:text-primary transition-colors cursor-pointer select-none disabled:opacity-50"
                    >
                      +
                    </button>
                    <span className="text-[10px] text-text-secondary ml-1 font-bold uppercase select-none">
                      {t("admin.units.abbr_" + unit) === ("admin.units.abbr_" + unit) ? unit : t("admin.units.abbr_" + unit)}
                    </span>
                  </div>

                  {/* Costo Estimado */}
                  <div className="text-right">
                    <span className="text-xs text-text-muted block sm:hidden">{t("projects.editor_est_cost")}</span>
                    <span className="text-sm sm:text-base font-black text-text-primary block w-28">
                      {formatPrice(mat.price)}
                    </span>
                  </div>

                  {/* Compra o Etiqueta Genérica */}
                  <div className="w-[100px] flex justify-center shrink-0">
                    {mat.productId ? (
                      <AddToCartButton
                        productId={mat.productId}
                        quantity={Math.ceil(num)}
                        label={t("projects.editor_buy_btn")}
                        fullWidth={false}
                        className="py-1.5 px-4 text-xs font-bold shadow-sm"
                      />
                    ) : (
                      <span className="text-[10px] text-text-muted italic select-none">
                        {t("projects.editor_generic_supply")}
                      </span>
                    )}
                  </div>

                  {/* Botón rápido para eliminar material */}
                  <div className="flex items-center pl-2 border-l border-border h-9">
                    <button
                      onClick={() => deleteMaterial(index)}
                      title={t("projects.editor_remove_material_tooltip")}
                      disabled={loading}
                      className="p-1.5 text-text-muted hover:text-error hover:bg-error/5 rounded-lg transition-all cursor-pointer"
                    >
                      <LucideIcon name="PauseCircle" size={16} />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Footer con Sumatoria Total */}
        <div className="p-5 bg-bg-surface-light border-t border-border flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-text-secondary block">
              {t("projects.editor_total_est_purchase")}
            </span>
            <span className="text-[10px] text-text-muted">
              {t("projects.editor_supplies_sub")}
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            {formatPrice(totalCost)}
          </span>
        </div>
      </div>
    </div>
  );
}

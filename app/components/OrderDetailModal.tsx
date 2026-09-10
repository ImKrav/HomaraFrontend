"use client";

import React, { useEffect } from "react";
import LucideIcon from "@/app/components/ui/LucideIcon";
import Button from "@/app/components/ui/Button";
import Badge from "@/app/components/ui/Badge";
import OrderSummaryBreakdown from "@/app/components/OrderSummaryBreakdown";
import { formatPrice } from "@/app/lib/utils";
import { useLanguage } from "@/app/context/LanguageContext";

export interface FullOrderDetailItem {
  id: string;
  productName: string;
  productImage?: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isBackorder?: boolean;
  backorderQuantity?: number;
}

export interface FullOrderDetail {
  id: string;
  dbId?: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingNotes: string | null;
  createdAt: string;
  customer?: {
    name: string;
    email: string;
  } | null;
  items: FullOrderDetailItem[];
}

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: FullOrderDetail | null;
  loading: boolean;
  portalSubtitle: string;
  closeBtnLabel?: string;
  onStatusChange?: (newStatus: string) => Promise<void> | void;
  updatingStatus?: boolean;
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case "Pisos y Cerámicas":
      return "Layers";
    case "Herramientas":
      return "Wrench";
    case "Pinturas":
      return "Paintbrush";
    case "Muebles":
      return "Sofa";
    case "Iluminación":
      return "Lightbulb";
    case "Materiales de Construcción":
      return "BrickWall";
    default:
      return "Package";
  }
}

function getStatusVariant(status: string): "success" | "error" | "info" | "warning" {
  const s = status?.toLowerCase();
  if (s === "entregado") return "success";
  if (s === "cancelado") return "error";
  if (s === "enviado") return "info";
  return "warning";
}

function getPaymentLabel(method: string, t: (k: string) => string): string {
  const m = method?.toLowerCase();
  if (m === "tarjeta_credito") return t("account.card_payment");
  if (m === "pse") return t("account.pse_payment");
  if (m === "contra_entrega") return t("account.cod_payment");
  return method || "—";
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  loading,
  portalSubtitle,
  closeBtnLabel,
  onStatusChange,
  updatingStatus,
}: Readonly<OrderDetailModalProps>) {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Accessible Backdrop */}
      <button
        type="button"
        aria-label="Cerrar modal"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm border-none w-full h-full cursor-default"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        className="bg-bg-surface border border-border max-w-2xl w-full rounded-none shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-slide-up z-10"
      >
        {/* Top decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 gradient-primary" />

        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
              {portalSubtitle}
            </span>
            <h3 id="order-modal-title" className="text-xl font-bold text-text-primary tracking-tight">
              {order ? `${t("account.order_title_prefix")}${order.id}` : t("account.order_loading_title")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 hover:bg-bg-surface-light transition-colors duration-200 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <LucideIcon name="X" size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
              <p className="text-xs text-text-secondary">{t("account.detail_loading")}</p>
            </div>
          ) : order ? (
            <>
              {/* General Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-bg-surface-light border border-border">
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("account.date_label")}</p>
                  <p className="text-sm font-semibold text-text-primary mt-1">
                    {new Date(order.createdAt).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("account.status_label")}</p>
                  <div className="mt-1">
                    <Badge variant={getStatusVariant(order.status)} size="sm">
                      {t(`status.${order.status?.toLowerCase()}`) || order.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("account.payment_label")}</p>
                  <p className="text-sm font-semibold text-text-primary mt-1 uppercase text-[10px] tracking-wide">
                    {getPaymentLabel(order.paymentMethod, t)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("account.total_label")}</p>
                  <p className="text-sm font-black text-primary mt-1">
                    {formatPrice(order.total)}
                  </p>
                </div>
              </div>

              {/* Shipping Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <LucideIcon name="MapPin" size={16} className="text-primary" />
                  {t("account.delivery_info")}
                </h4>
                <div className="p-4 border border-border space-y-2 text-sm bg-bg-surface-light/40">
                  <p className="text-text-secondary text-xs">
                    <strong className="text-text-primary font-semibold">{t("account.address_detail")}</strong> {order.shippingAddress || "—"}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <p className="text-text-secondary">
                      <strong className="text-text-primary font-semibold">{t("account.city_detail")}</strong> {order.shippingCity || "—"}
                    </p>
                    <p className="text-text-secondary">
                      <strong className="text-text-primary font-semibold">{t("account.state_detail")}</strong> {order.shippingState || "—"}
                    </p>
                  </div>
                  {order.shippingZip && (
                    <p className="text-text-secondary text-xs">
                      <strong className="text-text-primary font-semibold">{t("account.zip_detail")}</strong> {order.shippingZip}
                    </p>
                  )}
                  {order.shippingNotes && (
                    <div className="mt-3 p-3 bg-primary/5 border-l-2 border-primary text-xs text-text-secondary italic">
                      <span className="font-bold block text-text-primary not-italic uppercase tracking-wider text-[9px] mb-1">{t("account.notes_label")}</span>
                      &ldquo;{order.shippingNotes}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              {/* Status Changer if onStatusChange is provided */}
              {onStatusChange && (
                <div className="p-4 border border-border/80 bg-bg-surface-light/20 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="select-order-status" className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      {t("admin.modify_status")}
                    </label>
                    <select
                      id="select-order-status"
                      value={order.status?.toLowerCase()}
                      onChange={(e) => onStatusChange(e.target.value)}
                      disabled={updatingStatus}
                      className="w-full bg-bg-surface border border-border px-4 py-2.5 text-sm font-semibold text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all duration-200 cursor-pointer rounded-none"
                    >
                      <option value="pendiente">{t("status.pendiente")}</option>
                      <option value="procesando">{t("status.procesando")}</option>
                      <option value="enviado">{t("status.enviado")}</option>
                      <option value="entregado">{t("status.entregado")}</option>
                      <option value="cancelado">{t("status.cancelado")}</option>
                    </select>
                  </div>
                  {updatingStatus && (
                    <p className="text-[10px] text-primary animate-pulse font-medium">{t("admin.updating_db")}</p>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <LucideIcon name="Package" size={16} className="text-primary" />
                  {t("account.purchased_items")}
                </h4>
                <div className="border border-border divide-y divide-border overflow-hidden max-h-60 overflow-y-auto">
                  {order.items?.map((item) => (
                    <div key={item.id} className="p-3.5 flex gap-4 items-center bg-bg-surface-light/20 hover:bg-bg-surface-light/40 transition-colors">
                      <div className="w-12 h-12 flex-shrink-0 bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                        <LucideIcon name={getCategoryIcon(item.category)} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-bold text-text-primary truncate">{item.productName}</h5>
                        <p className="text-xs text-text-muted mt-0.5">{t(`categories.${item.category}`) || item.category}</p>
                        {item.isBackorder && (
                          <Badge variant="warning" size="sm" className="mt-1 normal-case tracking-normal">
                            {t("account.backorder_item_tag") || "Envío Diferido"}
                            {item.backorderQuantity && item.backorderQuantity > 0 ? ` (${item.backorderQuantity} ud)` : ""}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-text-primary">{formatPrice(item.total)}</p>
                        <p className="text-xs text-text-muted mt-0.5 font-mono">
                          {item.quantity} x {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Breakdown */}
              <OrderSummaryBreakdown
                subtotal={order.subtotal}
                shippingCost={order.shippingCost}
                total={order.total}
                labels={{
                  subtotal: t("account.subtotal_label"),
                  shipping: t("account.shipping_cost"),
                  freeShipping: t("account.free_shipping"),
                  total: t("account.grand_total"),
                }}
              />
            </>
          ) : (
            <div className="py-12 text-center text-sm text-error">
              {t("account.detail_error")}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-bg-surface-light/40 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="cursor-pointer rounded-none animate-scale-up"
          >
            {closeBtnLabel || t("account.close_btn")}
          </Button>
        </div>
      </div>
    </div>
  );
}

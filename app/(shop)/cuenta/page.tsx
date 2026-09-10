"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/app/lib/api";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import Badge from "@/app/components/ui/Badge";
import LucideIcon from "@/app/components/ui/LucideIcon";
import Input from "@/app/components/ui/Input";
import { showToast } from "@/app/lib/toast";
import OrderSummaryBreakdown from "@/app/components/OrderSummaryBreakdown";
import { useOrderDetailsModal } from "@/app/hooks/useOrderDetailsModal";
import { formatPrice, OrderDetail, Project } from "@/app/lib/utils";
import { useLanguage } from "@/app/context/LanguageContext";

interface FullOrderDetailItem {
  id: string;
  productName: string;
  productImage: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isBackorder?: boolean;
  backorderQuantity?: number;
}

interface FullOrderDetail {
  id: string;
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
  customer: {
    name: string;
    email: string;
  } | null;
  items: FullOrderDetailItem[];
}


export default function CuentaPage() {
  const { user, loading, isAuthenticated, logout, refreshUser } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Order Detail Modal States
  const {
    selectedOrder,
    loadingDetail,
    isDetailOpen,
    setIsDetailOpen,
    handleViewOrderDetails,
  } = useOrderDetailsModal<FullOrderDetail>(t("account.detail_error"));

  // Edit Profile Modal States
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const handleStartEdit = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
      });
      setEditError("");
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      setEditError(t("account.required_error"));
      return;
    }

    try {
      setSaving(true);
      setEditError("");
      const res = await api.put(`/api/v1/users/me`, formData);
      if (res.success) {
        await refreshUser();
        setIsEditing(false);
        showToast(t("account.save_success"), "success");
      } else {
        setEditError(res.error || t("account.save_error"));
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t("account.save_error");
      setEditError(message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    async function fetchUserData() {
      if (!isAuthenticated) return;
      try {
        setLoadingData(true);
        const ordersRes = await api.get("/api/v1/orders");
        if (ordersRes.success) {
          setOrders(ordersRes.data || []);
        }

        const projectsRes = await api.get("/api/v1/projects");
        if (projectsRes.success) {
          setProjects(projectsRes.data || []);
        }
      } catch (err: unknown) {
        console.error("Error cargando datos de cuenta:", err);
        setErrorMsg(t("account.error_loading"));
      } finally {
        setLoadingData(false);
      }
    }

    fetchUserData();
  }, [isAuthenticated, t]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getPaymentLabel = (method: string): string => {
    if (method === "credit_card") return t("account.payment_credit_card");
    if (method === "pse") return t("account.payment_pse");
    if (method === "cash") return t("account.payment_cash");
    return method || t("account.payment_unspecified");
  };

  if (loading || (isAuthenticated && loadingData)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-sm text-text-secondary">{t("account.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-extrabold text-text-primary mb-8 tracking-tight">{t("account.title")}</h1>

      {errorMsg && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 gradient-primary" />
            
            <div className="text-center pt-2">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-bold text-2xl shadow-inner">
                {user?.firstName?.charAt(0) || "U"}
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-text-muted mt-1 font-medium">{user?.email}</p>
              <p className="text-xs text-text-secondary mt-1 flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {user?.city ? `${user.city}, ${user.state || "Colombia"}` : t("account.location_unspecified")}
              </p>

              <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-4 text-center">
                <div className="hover:bg-bg-surface-light p-2 rounded-lg transition-colors">
                  <p className="text-2xl font-black text-primary">{projects.length}</p>
                  <p className="text-xs text-text-muted font-medium mt-0.5">{t("account.projects_label")}</p>
                </div>
                <div className="hover:bg-bg-surface-light p-2 rounded-lg transition-colors">
                  <p className="text-2xl font-black text-primary">{orders.length}</p>
                  <p className="text-xs text-text-muted font-medium mt-0.5">{t("account.orders_label")}</p>
                </div>
              </div>

              {user?.phone && (
                <div className="mt-4 text-left text-xs text-text-secondary bg-bg-surface-light p-3 rounded-lg space-y-1">
                  <p><strong>{t("account.phone_label")}</strong> {user.phone}</p>
                  {user.address && <p><strong>{t("account.address_label")}</strong> {user.address}</p>}
                </div>
              )}

              <div className="mt-6 space-y-2">
                <Button variant="outline" size="sm" fullWidth onClick={handleStartEdit} className="cursor-pointer rounded-none">
                  {t("account.edit_profile_btn")}
                </Button>
                <Button variant="danger" size="sm" fullWidth onClick={handleLogout} className="cursor-pointer rounded-none">
                  {t("account.logout_btn")}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Area (Orders & Projects) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Projects Summary */}
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-4 tracking-tight flex items-center gap-2">
              <span className="p-1.5 bg-primary/10 rounded-none text-primary flex items-center justify-center">
                <LucideIcon name="Maximize2" size={16} />
              </span>
              {t("account.my_estimated_projects")}
            </h2>
            {projects.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-sm text-text-secondary">{t("account.no_projects")}</p>
                <Button variant="primary" size="sm" href="/proyectos/nuevo" className="mt-4">
                  {t("account.create_project_btn")}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((project: Project) => (
                  <Card key={project.id} hover className="relative overflow-hidden cursor-pointer" onClick={() => router.push(`/proyectos/${project.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <LucideIcon name={project.thumbnail || "Home"} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-text-primary truncate">{project.name}</h4>
                        <p className="text-xs text-text-muted mt-0.5">{t("account.area_label")} {project.area} m²</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-text-primary">{formatPrice(project.estimatedCost)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Orders History */}
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-4 tracking-tight flex items-center gap-2">
              <span className="p-1.5 bg-primary/10 rounded-none text-primary flex items-center justify-center">
                <LucideIcon name="Package" size={16} />
              </span>
              {t("account.order_history")}
            </h2>

            {orders.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-sm text-text-secondary">{t("account.no_orders")}</p>
                <Button variant="outline" size="sm" href="/catalogo" className="mt-4">
                  {t("account.go_catalog_btn")}
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order: OrderDetail) => {
                  const s = order.status?.toLowerCase();
                  const statusVariant =
                    s === "entregado"
                      ? "success"
                      : s === "cancelado"
                      ? "error"
                      : s === "enviado"
                      ? "info"
                      : "warning";

                  return (
                    <Card 
                      key={order.id} 
                      hover 
                      className="cursor-pointer" 
                      onClick={() => handleViewOrderDetails(order.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-text-primary">
                              {order.id}
                            </p>
                            <Badge variant={statusVariant} size="sm">
                              {t(`status.${order.status?.toLowerCase()}`) || order.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-muted mt-1.5 font-medium">
                            {new Date(order.date).toLocaleDateString("es-CO", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}{" "}
                            • {order.items} {order.items === 1 ? t("account.item_singular") : t("account.item_plural")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-text-primary">
                            {formatPrice(order.total)}
                          </p>
                          <button 
                            className="text-xs text-primary font-semibold hover:underline mt-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrderDetails(order.id);
                            }}
                          >
                            {t("account.view_delivery")}
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-surface border border-border p-6 max-w-lg w-full rounded-none shadow-2xl relative">
            <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">
              {t("account.edit_profile_title")}
            </h3>
            <p className="text-xs text-text-muted mb-6">
              {t("account.edit_profile_desc")}
            </p>

            {editError && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("account.first_name_label")}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label={t("account.last_name_label")}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <Input
                label={t("account.phone_input_label")}
                placeholder="Ej: 300 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Input
                label={t("account.address_input_label")}
                placeholder="Ej: Calle 123 # 45-67"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("account.city_input_label")}
                  placeholder="Ej: Bogotá"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label={t("account.state_input_label")}
                  placeholder="Ej: Cundinamarca"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>

              <Input
                label={t("account.zip_input_label")}
                placeholder="Ej: 110111"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="rounded-none"
                  type="button"
                >
                  {t("account.cancel_btn")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  className="rounded-none"
                  type="submit"
                >
                  {saving ? t("account.saving") : t("account.save_btn")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {isDetailOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setIsDetailOpen(false)}
        >
          <div 
            className="bg-bg-surface border border-border max-w-2xl w-full rounded-none shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 gradient-primary" />
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{t("account.order_summary_label")}</span>
                <h3 className="text-xl font-bold text-text-primary tracking-tight">
                  {selectedOrder ? `${t("account.order_title_prefix")}${selectedOrder.id}` : t("account.order_loading_title")}
                </h3>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="text-text-muted hover:text-text-primary p-1.5 hover:bg-bg-surface-light transition-colors duration-200 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                  <p className="text-xs text-text-secondary">{t("account.detail_loading")}</p>
                </div>
              ) : selectedOrder ? (
                <>
                  {/* General Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-bg-surface-light border border-border">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("account.date_label")}</p>
                      <p className="text-sm font-semibold text-text-primary mt-1">
                        {new Date(selectedOrder.createdAt).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("account.status_label")}</p>
                      <div className="mt-1">
                        <Badge 
                          variant={
                            selectedOrder.status.toLowerCase() === "entregado"
                              ? "success"
                              : selectedOrder.status.toLowerCase() === "cancelado"
                              ? "error"
                              : selectedOrder.status.toLowerCase() === "enviado"
                              ? "info"
                              : "warning"
                          } 
                          size="sm"
                        >
                          {t(`status.${selectedOrder.status?.toLowerCase()}`) || selectedOrder.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("account.payment_label")}</p>
                      <p className="text-sm font-semibold text-text-primary mt-1 uppercase text-[10px] tracking-wide">
                        {getPaymentLabel(selectedOrder.paymentMethod)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("account.total_label")}</p>
                      <p className="text-sm font-black text-primary mt-1">
                        {formatPrice(selectedOrder.total)}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t("account.delivery_info")}
                    </h4>
                    <div className="p-4 border border-border space-y-2 text-sm bg-bg-surface-light/40">
                      <p className="text-text-secondary text-xs">
                        <strong className="text-text-primary font-semibold">{t("account.address_detail")}</strong> {selectedOrder.shippingAddress || "—"}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <p className="text-text-secondary">
                          <strong className="text-text-primary font-semibold">{t("account.city_detail")}</strong> {selectedOrder.shippingCity || "—"}
                        </p>
                        <p className="text-text-secondary">
                          <strong className="text-text-primary font-semibold">{t("account.state_detail")}</strong> {selectedOrder.shippingState || "—"}
                        </p>
                      </div>
                      {selectedOrder.shippingZip && (
                        <p className="text-text-secondary text-xs">
                          <strong className="text-text-primary font-semibold">{t("account.zip_detail")}</strong> {selectedOrder.shippingZip}
                        </p>
                      )}
                      {selectedOrder.shippingNotes && (
                        <div className="mt-3 p-3 bg-primary/5 border-l-2 border-primary text-xs text-text-secondary italic">
                          <span className="font-bold block text-text-primary not-italic uppercase tracking-wider text-[9px] mb-1">{t("account.notes_label")}</span>
                          &ldquo;{selectedOrder.shippingNotes}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {t("account.purchased_items")}
                    </h4>
                    <div className="border border-border divide-y divide-border overflow-hidden max-h-60 overflow-y-auto">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="p-3.5 flex gap-4 items-center bg-bg-surface-light/20 hover:bg-bg-surface-light/40 transition-colors">
                          <div className="w-12 h-12 flex-shrink-0 bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                            <LucideIcon 
                              name={
                                item.category === "Pisos y Cerámicas" ? "Layers" :
                                item.category === "Herramientas" ? "Wrench" :
                                item.category === "Pinturas" ? "Paintbrush" :
                                item.category === "Muebles" ? "Sofa" :
                                item.category === "Iluminación" ? "Lightbulb" :
                                item.category === "Materiales de Construcción" ? "BrickWall" :
                                "Package"
                              } 
                              size={20}
                            />
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
                            <p className="text-xs text-text-muted mt-0.5">
                              {item.quantity} x {formatPrice(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <OrderSummaryBreakdown
                    subtotal={selectedOrder.subtotal}
                    shippingCost={selectedOrder.shippingCost}
                    total={selectedOrder.total}
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
                onClick={() => setIsDetailOpen(false)}
                className="cursor-pointer rounded-none animate-scale-up"
              >
                {t("account.close_btn")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

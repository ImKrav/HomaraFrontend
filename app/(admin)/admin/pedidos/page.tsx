"use client";

import { useState, useEffect } from "react";
import Card from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import Button from "@/app/components/ui/Button";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { formatPrice, OrderDetail } from "@/app/lib/utils";
import { api } from "@/app/lib/api";
import { showToast } from "@/app/lib/toast";
import { useLanguage } from "@/app/context/LanguageContext";
import Pagination from "@/app/components/ui/Pagination";

interface FullOrderDetailItem {
  id: string;
  productName: string;
  productImage: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface FullOrderDetail {
  id: string;
  dbId: string;
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

export default function AdminPedidosPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  const ITEMS_PER_PAGE = 25;

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState<FullOrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const json = await api.get("/api/v1/orders?admin=true");
      if (json.success) {
        setOrders(json.data || []);
      }
    } catch (err: unknown) {
      console.error("Error cargando pedidos:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedDate]);

  const filteredOrders = orders.filter((order) => {
    // Search query matches order number/ID, customer name, or address/notes (if any)
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.shippingAddress && order.shippingAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.shippingCity && order.shippingCity.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus =
      selectedStatus === "all" ||
      order.status?.toLowerCase() === selectedStatus.toLowerCase();

    // Date filter comparison (YYYY-MM-DD)
    let matchesDate = true;
    if (selectedDate) {
      const d = new Date(order.date);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localOrderDate = `${year}-${month}-${day}`;
        matchesDate = localOrderDate === selectedDate;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const sortedOrders = [...filteredOrders];

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleViewOrderDetails = async (orderId: string) => {
    try {
      setLoadingDetail(true);
      setIsDetailOpen(true);
      setSelectedOrder(null);
      
      const res = await api.get(`/api/v1/orders/${orderId}`);
      if (res.success && res.data) {
        setSelectedOrder(res.data);
      } else {
        showToast(res.error || t("admin.order_errors.detail_error"), "error");
        setIsDetailOpen(false);
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t("admin.order_errors.detail_error_fetch");
      showToast(message, "error");
      setIsDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;

    try {
      setUpdatingStatus(true);
      const res = await api.put(`/api/v1/orders/${selectedOrder.dbId}/status`, {
        status: newStatus.toUpperCase(),
      });

      if (res.success) {
        // Update detail modal state
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus.toLowerCase() } : null);
        
        // Update local list state
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o.dbId === selectedOrder.dbId ? { ...o, status: newStatus.toLowerCase() } : o
          )
        );

        const translatedStatus = t(`status.${newStatus.toLowerCase()}`);
        const toastMsg = t("admin.order_errors.update_status_success")
          .replace("{id}", selectedOrder.id)
          .replace("{status}", translatedStatus);
        showToast(toastMsg, "success");
      } else {
        showToast(res.error || t("admin.order_errors.update_status_error"), "error");
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t("admin.order_errors.update_status_error_fetch");
      showToast(message, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const orderStats = {
    total: orders.length,
    pendientes: orders.filter((o: OrderDetail) => {
      const s = o.status?.toLowerCase();
      return s === "pendiente" || s === "procesando";
    }).length,
    enviados: orders.filter((o: OrderDetail) => o.status?.toLowerCase() === "enviado").length,
    entregados: orders.filter((o: OrderDetail) => o.status?.toLowerCase() === "entregado").length,
  };

  if (loading && orders.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary">
        {t("admin.loading_orders")}
      </div>
    );
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error text-sm">
          <p className="font-semibold">{t("admin.error_loading_orders")}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t("admin.orders")}</h1>
        <p className="mt-2 text-text-secondary">
          {t("admin.orders_tagline")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: t("admin.metrics.total_orders"), value: orderStats.total, icon: "ClipboardList" },
          { label: t("admin.metrics.pending_process"), value: orderStats.pendientes, icon: "RotateCw" },
          { label: t("admin.metrics.sent"), value: orderStats.enviados, icon: "Package" },
          { label: t("admin.metrics.delivered"), value: orderStats.entregados, icon: "CheckCircle2" },
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
                <LucideIcon name={stat.icon} size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-bg-surface border border-border p-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <LucideIcon name="Search" size={16} />
          </span>
          <input
            type="text"
            placeholder={t("catalog.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border bg-bg-base text-text-primary text-sm focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <LucideIcon name="X" size={14} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-bg-base text-text-primary text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">{t("catalog.all_categories")} ({t("admin.status_col")})</option>
            <option value="pendiente">{t("status.pendiente")}</option>
            <option value="procesando">{t("status.procesando")}</option>
            <option value="enviado">{t("status.enviado")}</option>
            <option value="entregado">{t("status.entregado")}</option>
            <option value="cancelado">{t("status.cancelado")}</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            title={t("admin.filter_date")}
            className="w-full px-3 py-2 border border-border bg-bg-base text-text-primary text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              type="button"
              title={t("catalog.clean_search")}
            >
              <LucideIcon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-bg-surface-light/40">
                <th className="py-3.5 px-4 text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.order_col")}
                </th>
                <th className="py-3.5 px-4 text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.customer_col")}
                </th>
                <th className="py-3.5 px-4 text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.date_col")}
                </th>
                <th className="py-3.5 px-4 text-center text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.items_col")}
                </th>
                <th className="py-3.5 px-4 text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.status_col")}
                </th>
                <th className="py-3.5 px-4 text-right text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.total_col")}
                </th>
                <th className="py-3.5 px-4 text-right text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  {t("admin.actions_col")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginatedOrders.map((order: OrderDetail) => {
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
                  <tr
                    key={order.id}
                    className="hover:bg-bg-surface-light transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {order.id}
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-medium">
                      {order.customer}
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {new Date(order.date).toLocaleDateString(t("locale"), {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-3 px-4 text-center text-text-secondary font-mono">
                      {order.items}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant} size="sm">
                        {t(`status.${order.status?.toLowerCase()}`)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-text-primary">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        id={`btn-view-order-${order.id}`}
                        onClick={() => handleViewOrderDetails(order.id)}
                        className="text-xs text-primary hover:underline cursor-pointer font-semibold"
                      >
                        {t("admin.view_detail_action")}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted">
                    {orders.length === 0 ? t("admin.no_orders_registered") : t("catalog.no_results")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {sortedOrders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedOrders.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
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
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{t("admin.control_panel")}</span>
                <h3 className="text-xl font-bold text-text-primary tracking-tight">
                  {selectedOrder ? `${t("admin.order_detail_title")} #${selectedOrder.id}` : t("admin.loading")}
                </h3>
              </div>
              <button 
                id="btn-close-modal"
                onClick={() => setIsDetailOpen(false)}
                className="text-text-muted hover:text-text-primary p-1.5 hover:bg-bg-surface-light transition-colors duration-200 cursor-pointer"
              >
                <LucideIcon name="Plus" className="rotate-45" size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                  <p className="text-xs text-text-secondary">{t("admin.loading_detail")}</p>
                </div>
              ) : selectedOrder ? (
                <>
                  {/* General Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-bg-surface-light border border-border">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("admin.date_col")}</p>
                      <p className="text-sm font-semibold text-text-primary mt-1">
                        {new Date(selectedOrder.createdAt).toLocaleDateString(t("locale"), {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("admin.current_status")}</p>
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
                          {t(`status.${selectedOrder.status.toLowerCase()}`)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("admin.payment_method")}</p>
                      <p className="text-sm font-semibold text-text-primary mt-1 uppercase text-[10px] tracking-wide">
                        {selectedOrder.paymentMethod ? t(`admin.payment_methods.${selectedOrder.paymentMethod}`) : t("admin.payment_methods.unspecified")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("admin.total_transaction")}</p>
                      <p className="text-sm font-black text-primary mt-1">
                        {formatPrice(selectedOrder.total)}
                      </p>
                    </div>
                  </div>

                  {/* Customer and Shipping Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Customer */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <LucideIcon name="User" size={14} className="text-primary" />
                        {t("admin.customer_info")}
                      </h4>
                      <div className="p-4 border border-border space-y-1.5 text-xs bg-bg-surface-light/40 h-full">
                        <p className="text-text-secondary">
                          <strong className="text-text-primary font-semibold">{t("admin.name_label")}:</strong> {selectedOrder.customer?.name || t("admin.order_errors.unknown_customer")}
                        </p>
                        <p className="text-text-secondary">
                          <strong className="text-text-primary font-semibold">{t("auth.email")}:</strong> {selectedOrder.customer?.email || t("admin.order_errors.unknown_customer")}
                        </p>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <LucideIcon name="Home" size={14} className="text-primary" />
                        {t("admin.shipping_address")}
                      </h4>
                      <div className="p-4 border border-border space-y-1.5 text-xs bg-bg-surface-light/40 h-full">
                        <p className="text-text-secondary">
                          <strong className="text-text-primary font-semibold">{t("admin.address_label")}:</strong> {selectedOrder.shippingAddress || t("admin.order_errors.not_specified_address")}
                        </p>
                        <p className="text-text-secondary">
                          <strong className="text-text-primary font-semibold">{t("admin.city_state_label")}:</strong> {selectedOrder.shippingCity ? `${selectedOrder.shippingCity}, ${selectedOrder.shippingState || ""}` : t("admin.order_errors.not_specified_city")}
                        </p>
                        {selectedOrder.shippingZip && (
                          <p className="text-text-secondary">
                            <strong className="text-text-primary font-semibold">{t("admin.zip_label")}:</strong> {selectedOrder.shippingZip}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Notes if any */}
                  {selectedOrder.shippingNotes && (
                    <div className="p-3 bg-primary/5 border-l-2 border-primary text-xs text-text-secondary italic">
                      <span className="font-bold block text-text-primary not-italic uppercase tracking-wider text-[9px] mb-1">{t("admin.delivery_notes")}:</span>
                      &ldquo;{selectedOrder.shippingNotes}&rdquo;
                    </div>
                  )}

                  {/* Status Changer */}
                  <div className="p-4 border border-border/80 bg-bg-surface-light/20 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="select-order-status" className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        {t("admin.modify_status")}
                      </label>
                      <select
                        id="select-order-status"
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
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

                  {/* Order Items */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <LucideIcon name="Package" size={14} className="text-primary" />
                      {t("admin.order_items")}
                    </h4>
                    <div className="border border-border divide-y divide-border overflow-hidden max-h-60 overflow-y-auto">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="p-3.5 flex gap-4 items-center bg-bg-surface-light/20 hover:bg-bg-surface-light/40 transition-colors">
                          <div className="w-10 h-10 flex-shrink-0 bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
                            <LucideIcon name={item.category === "Pisos y Cerámicas" ? "Layers" : "Package"} size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-bold text-text-primary truncate">{item.productName}</h5>
                            <p className="text-xs text-text-muted mt-0.5">{t(`categories.${item.category}`) || item.category}</p>
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
                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>{t("admin.subtotal_items")}</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>{t("admin.shipping_cost")}</span>
                      <span>{selectedOrder.shippingCost === 0 ? t("admin.free_shipping") : formatPrice(selectedOrder.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-text-primary pt-2 border-t border-border border-dashed">
                      <span>{t("admin.grand_total")}</span>
                      <span className="text-base text-primary">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-sm text-error">
                  {t("admin.order_errors.info_error")}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-bg-surface-light/40 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDetailOpen(false)}
                className="cursor-pointer rounded-none"
              >
                {t("admin.close_btn")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

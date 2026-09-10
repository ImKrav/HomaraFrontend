"use client";

import { useState, useEffect } from "react";
import Card from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { formatPrice, OrderDetail } from "@/app/lib/utils";
import { api } from "@/app/lib/api";
import { showToast } from "@/app/lib/toast";
import { useLanguage } from "@/app/context/LanguageContext";
import Pagination from "@/app/components/ui/Pagination";
import SearchInput from "@/app/components/ui/SearchInput";
import { useOrderDetailsModal } from "@/app/hooks/useOrderDetailsModal";
import OrderDetailModal, { FullOrderDetail } from "@/app/components/OrderDetailModal";

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
  const {
    selectedOrder,
    setSelectedOrder,
    loadingDetail,
    isDetailOpen,
    setIsDetailOpen,
    handleViewOrderDetails,
  } = useOrderDetailsModal<FullOrderDetail>(t("admin.order_errors.detail_error_fetch"));
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
      order.shippingAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingCity?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      selectedStatus === "all" ||
      order.status?.toLowerCase() === selectedStatus.toLowerCase();

    // Date filter comparison (YYYY-MM-DD)
    let matchesDate = true;
    if (selectedDate) {
      const d = new Date(order.date);
      if (!Number.isNaN(d.getTime())) {
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
        <SearchInput
          placeholder={t("catalog.search_placeholder")}
          value={searchQuery}
          onChange={setSearchQuery}
        />

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
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
        loading={loadingDetail}
        portalSubtitle={t("admin.control_panel")}
        closeBtnLabel={t("admin.close_btn")}
        onStatusChange={handleStatusChange}
        updatingStatus={updatingStatus}
      />
    </div>
  );
}

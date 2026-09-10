"use client";

import { useState, useEffect } from "react";
import Card from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { formatPrice, AdminMetric, OrderDetail } from "@/app/lib/utils";
import { api } from "@/app/lib/api";
import { useLanguage } from "@/app/context/LanguageContext";
import AdminFeedbackState from "@/app/components/AdminFeedbackState";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetric[]>([]);
  const [charts, setCharts] = useState({
    salesByMonth: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    topCategories: [] as { name: string; pct: number }[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // El api client automáticamente inyecta el token Bearer desde localStorage
        const [ordersJson, metricsJson] = await Promise.all([
          api.get("/api/v1/orders?admin=true"),
          api.get("/api/v1/admin/metrics")
        ]);

        if (ordersJson.success) {
          setOrders(ordersJson.data || []);
        }
        if (metricsJson.success) {
          setAdminMetrics(metricsJson.data || []);
          if (metricsJson.charts) {
            setCharts({
              salesByMonth: metricsJson.charts.salesByMonth || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              topCategories: metricsJson.charts.topCategories || []
            });
          }
        }
      } catch (err: unknown) {
        console.error("Error cargando datos del dashboard:", err);
        setError(err instanceof Error ? err.message : t("admin.unknown_error"));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMetricLabel = (label: string) => {
    switch (label) {
      case "Ventas del Mes": return t("admin.metrics.monthly_sales");
      case "Pedidos Activos": return t("admin.metrics.active_orders");
      case "Productos": return t("admin.metrics.products");
      case "Clientes Nuevos": return t("admin.metrics.new_customers");
      default: return label;
    }
  };

  if (loading || error) {
    return (
      <AdminFeedbackState
        loading={loading}
        loadingMessage={t("admin.loading")}
        error={error}
        errorTitle={t("admin.error_loading")}
      />
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">{t("admin.dashboard")}</h1>
        <p className="mt-2 text-text-secondary">
          {t("admin.tagline")}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {adminMetrics.map((metric: AdminMetric) => (
          <Card key={metric.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">{getMetricLabel(metric.label)}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {metric.value}
                </p>
              </div>
              <LucideIcon name={metric.icon} size={24} className="text-primary" />
            </div>
            <div className="mt-3">
              <span
                className={`text-xs font-medium ${
                  metric.change >= 0 ? "text-success" : "text-error"
                }`}
              >
                {metric.change >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(metric.change)}%
              </span>
              <span className="text-xs text-text-muted ml-1">
                {t("admin.vs_previous")}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            {t("admin.sales_by_month")}
          </h3>
          <div className="h-48 flex items-end gap-2 px-4">
            {charts.salesByMonth.map((val: number, i: number) => {
              const maxVal = Math.max(...charts.salesByMonth, 1);
              const pct = Math.round((val / maxVal) * 100);
              const monthName = [
                t("admin.jan"), t("admin.feb"), t("admin.mar"), t("admin.apr"),
                t("admin.may"), t("admin.jun"), t("admin.jul"), t("admin.aug"),
                t("admin.sep"), t("admin.oct"), t("admin.nov"), t("admin.dec")
              ][i];

                return (
                <div key={monthName} className="flex-1 h-full flex flex-col items-center gap-1 group relative">
                  {/* Tooltip con Glassmorphism */}
                  <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-bg-surface-dark/95 backdrop-blur-sm text-text-primary text-[10px] py-1.5 px-2.5 rounded-lg border border-border/50 shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-[-2px] transition-all duration-150 z-30 whitespace-nowrap flex flex-col items-center">
                    <span className="font-semibold text-text-primary">{monthName}</span>
                    <span className="text-primary font-medium mt-0.5">{formatPrice(val)}</span>
                    {val > 0 && (
                      <span className="text-[8px] text-text-muted mt-0.5">{pct}% {t("month_abbr.pct_of_max")}</span>
                    )}
                  </div>

                  <div className="flex-1 w-full flex items-end">
                    <div
                      title={`Ventas de ${monthName}: ${formatPrice(val)}`}
                      aria-label={`Ventas de ${monthName}: ${formatPrice(val)}`}
                      className="w-full bg-primary/20 rounded-t-md hover:bg-primary/50 transition-all duration-200 cursor-pointer"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted">
                    {[
                      t("month_abbr.jan_abbr"),
                      t("month_abbr.feb_abbr"),
                      t("month_abbr.mar_abbr"),
                      t("month_abbr.apr_abbr"),
                      t("month_abbr.may_abbr"),
                      t("month_abbr.jun_abbr"),
                      t("month_abbr.jul_abbr"),
                      t("month_abbr.aug_abbr"),
                      t("month_abbr.sep_abbr"),
                      t("month_abbr.oct_abbr"),
                      t("month_abbr.nov_abbr"),
                      t("month_abbr.dec_abbr")
                    ][i]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            {t("admin.top_categories")}
          </h3>
          <div className="space-y-4">
            {charts.topCategories.length > 0 ? (
              charts.topCategories.map((cat: { name: string; pct: number }) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{t(`categories.${cat.name}`) || cat.name}</span>
                    <span className="text-text-primary font-medium">
                      {cat.pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-bg-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted text-center pt-8">
                {t("admin.no_data")}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-text-primary">
            {t("admin.recent_orders")}
          </h3>
          <a
            href="/admin/pedidos"
            className="text-xs text-primary hover:underline"
          >
            {t("admin.view_all")}
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  {t("admin.order_col")}
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  {t("admin.customer_col")}
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  {t("admin.date_col")}
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  {t("admin.status_col")}
                </th>
                <th className="text-right py-3 px-4 text-text-muted font-medium">
                  {t("admin.total_col")}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order: OrderDetail) => {
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
                    className="border-b border-border/50 hover:bg-bg-surface-light transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {order.id}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {order.customer}
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {new Date(order.date).toLocaleDateString(t("locale"))}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant} size="sm">
                        {t(`status.${order.status?.toLowerCase()}`) || order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-text-primary">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    {t("admin.no_recent_orders")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

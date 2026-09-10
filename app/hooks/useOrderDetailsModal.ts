import { useState } from "react";
import { api } from "@/app/lib/api";
import { showToast } from "@/app/lib/toast";

export function useOrderDetailsModal<T = unknown>(defaultErrorMessage: string) {
  const [selectedOrder, setSelectedOrder] = useState<T | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewOrderDetails = async (orderId: string) => {
    try {
      setLoadingDetail(true);
      setIsDetailOpen(true);
      setSelectedOrder(null);

      const res = await api.get(`/api/v1/orders/${orderId}`);
      if (res.success && res.data) {
        setSelectedOrder(res.data as T);
      } else {
        showToast(res.error || defaultErrorMessage, "error");
        setIsDetailOpen(false);
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : defaultErrorMessage;
      showToast(message, "error");
      setIsDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  return {
    selectedOrder,
    setSelectedOrder,
    loadingDetail,
    isDetailOpen,
    setIsDetailOpen,
    handleViewOrderDetails,
  };
}

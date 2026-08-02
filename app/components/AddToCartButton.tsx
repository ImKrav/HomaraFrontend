"use client";

import { useState } from "react";
import Button from "./ui/Button";
import { api } from "@/app/lib/api";
import { showToast } from "@/app/lib/toast";
import { useLanguage } from "@/app/context/LanguageContext";

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function AddToCartButton({ 
  productId, 
  quantity = 1, 
  label,
  className = "",
  disabled = false,
  fullWidth = true
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const defaultLabel = label ?? t("catalog.add_to_cart");

  const handleAdd = async () => {
    try {
      setLoading(true);
      const json = await api.post("/api/v1/cart/items", { productId, quantity });
      
      if (json.success) {
        window.dispatchEvent(new Event("cartUpdated"));
        showToast(t("catalog.add_to_cart_success"), "success");
      } else {
        showToast(json.error || t("catalog.add_to_cart_error"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("catalog.add_to_cart_conn_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleAdd} 
      disabled={disabled || loading} 
      className={className} 
      size="lg"
      fullWidth={fullWidth}
    >
      {loading ? t("catalog.adding_to_cart") : defaultLabel}
    </Button>
  );
}

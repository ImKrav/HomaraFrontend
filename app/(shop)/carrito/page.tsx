"use client";

import { useState, useEffect } from "react";
import CartItemCard from "@/app/components/CartItem";
import Button from "@/app/components/ui/Button";
import AuthRequiredState from "@/app/components/AuthRequiredState";
import { formatPrice, CartItemDetail } from "@/app/lib/utils";
import { api } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { useLanguage } from "@/app/context/LanguageContext";

export default function CarritoPage() {
  const [cartItems, setCartItems] = useState<CartItemDetail[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const json = await api.get("/api/v1/cart");
      if (json.success && json.data) {
        setCartItems(json.data.items || []);
        setSubtotal(json.data.subtotal || 0);
        setShipping(json.data.shipping || 0);
        setTotal(json.data.total || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (index: number, quantity: number) => {
    const item = cartItems[index];
    try {
      await api.put(`/api/v1/cart/items/${item.id}`, { quantity });
      fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (index: number) => {
    const item = cartItems[index];
    try {
      await api.delete(`/api/v1/cart/items/${item.id}`);
      fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading || (loading && isAuthenticated)) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center">{t("cart.loading")}</div>;
  }

  if (!isAuthenticated) {
    return (
      <AuthRequiredState
        icon="ShoppingCart"
        title={t("cart.login_required_title")}
        description={t("cart.login_required_desc")}
        loginButtonLabel={t("cart.login_btn")}
        registerButtonLabel={t("cart.register_btn")}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        {t("cart.title")}
      </h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-text-muted mb-4 flex justify-center">
            <LucideIcon name="ShoppingCart" size={64} />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {t("cart.empty_title")}
          </h3>
          <p className="text-text-secondary mb-6">
            {t("cart.empty_desc")}
          </p>
          <Button href="/catalogo">{t("cart.go_catalog")}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.some(item => item.isBackorder) && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                <LucideIcon name="Clock" size={20} className="flex-shrink-0 text-amber-500 mt-0.5" />
                <p className="leading-normal">{t("cart.backorder_warning")}</p>
              </div>
            )}
            {cartItems.map((item, index) => (
              <CartItemCard
                key={item.product.id}
                product={item.product}
                quantity={item.quantity}
                updatedAt={item.updatedAt}
                isBackorder={item.isBackorder}
                backorderQuantity={item.backorderQuantity}
                availableStock={item.availableStock}
                onQuantityChange={(q) => handleQuantityChange(index, q)}
                onRemove={() => handleRemove(index)}
              />
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-bg-surface rounded-none border border-border p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-text-primary mb-6">
                {t("cart.order_summary")}
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    {t("cart.subtotal")} ({cartItems.length} {t("cart.products_count")})
                  </span>
                  <span className="text-text-primary font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t("cart.shipping")}</span>
                  <span className="text-text-primary font-medium">
                    {shipping === 0 ? (
                      <span className="text-success">{t("cart.free")}</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-text-muted">
                    {t("cart.free_shipping_threshold")} {formatPrice(500000)}
                  </p>
                )}
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-text-primary font-semibold">
                    {t("cart.total")}
                  </span>
                  <span className="text-xl font-bold gradient-text">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <Button href="/checkout" size="lg" fullWidth className="mt-6">
                {t("cart.checkout_btn")}
              </Button>

              <Button
                href="/catalogo"
                variant="ghost"
                size="sm"
                fullWidth
                className="mt-3"
              >
                {t("cart.continue_shopping")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { formatPrice, CartItemDetail } from "@/app/lib/utils";
import { api } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { showToast } from "@/app/lib/toast";
import { useLanguage } from "@/app/context/LanguageContext";

interface CartState {
  items: CartItemDetail[];
  subtotal: number;
  shipping: number;
  total: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  
  const [cart, setCart] = useState<CartState>({ items: [], subtotal: 0, shipping: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
      return;
    }

    // Pre-populate fields from authenticated user
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setState(user.state || "");
      setZip(user.zipCode || "");
    }

    async function fetchCart() {
      try {
        const json = await api.get("/api/v1/cart");
        if (json.success) {
          setCart(json.data);
        }
      } catch (err) {
        console.error("Error fetching cart", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, [authLoading, isAuthenticated, user, router]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !address || !city || !state) {
      showToast(t("checkout.required_fields_error"), "warning");
      return;
    }

    try {
      setProcessing(true);
      const data = await api.post("/api/v1/orders", {
        paymentMethod,
        shippingAddress: address,
        shippingCity: city,
        shippingState: state,
        shippingZip: zip,
        shippingNotes: notes
      });

      if (data.success) {
        window.dispatchEvent(new Event("cartUpdated"));
        showToast(t("checkout.order_success"), "success");
        router.push("/proyectos");
      } else {
        showToast(data.error || t("checkout.order_error"), "error");
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t("checkout.payment_error");
      showToast(message, "error");
    } finally {
      setProcessing(false);
    }
  };

  const checkoutItems = cart.items || [];
  const subtotal = cart.subtotal || 0;
  const shipping = cart.shipping || 0;
  const total = cart.total || 0;

  const paymentOptions = [
    { id: "card", label: t("checkout.payment_card"), icon: "CreditCard" },
    { id: "pse", label: t("checkout.payment_pse"), icon: "Landmark" },
    { id: "cash", label: t("checkout.payment_cash"), icon: "Banknote" },
  ];

  if (authLoading || loading) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-text-secondary">{t("checkout.loading")}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">{t("checkout.title")}</h1>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact */}
          <Card>
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {t("checkout.contact_info")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("checkout.first_name")}
                placeholder="Juan"
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label={t("checkout.last_name")}
                placeholder="Pérez"
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <Input
                label={t("checkout.email")}
                type="email"
                placeholder="juan@email.com"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="sm:col-span-2"
              />
              <Input
                label={t("checkout.phone")}
                type="tel"
                placeholder="300 123 4567"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </Card>

          {/* Shipping */}
          <Card>
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {t("checkout.shipping_address")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("checkout.address")}
                placeholder="Calle 123 # 45-67"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="sm:col-span-2"
              />
              <Input
                label={t("checkout.city")}
                placeholder="Bogotá"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <Input
                label={t("checkout.state")}
                placeholder="Cundinamarca"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
              <Input
                label={t("checkout.zip")}
                placeholder="110111"
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
              <Input
                label={t("checkout.notes")}
                placeholder="Apto 302, Torre B"
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </Card>

          {/* Payment */}
          <Card>
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {t("checkout.payment_method")}
            </h2>
            <div className="space-y-3">
              {paymentOptions.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    paymentMethod === method.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-primary"
                  />
                  <div className="text-primary flex items-center">
                    <LucideIcon name={method.icon} size={18} />
                  </div>
                  <span className="text-sm text-text-primary font-medium">
                    {method.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Card mockup fields */}
            {paymentMethod === "card" && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("checkout.card_number")}
                  placeholder="1234 5678 9012 3456"
                  id="card-number"
                  className="sm:col-span-2"
                />
                <Input
                  label={t("checkout.card_expiry")}
                  placeholder="MM/AA"
                  id="card-expiry"
                />
                <Input
                  label={t("checkout.card_cvv")}
                  placeholder="123"
                  id="card-cvv"
                />
              </div>
            )}
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-bg-surface rounded-none border border-border p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {t("checkout.order_summary")}
            </h2>

            <div className="space-y-4 mb-6">
              {checkoutItems.map((item: CartItemDetail) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-bg-surface-light rounded-none flex items-center justify-center text-primary/80 flex-shrink-0">
                    <LucideIcon name={item.product.categorySlug} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      x{item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-text-secondary">{t("checkout.subtotal")}</span>
                <span className="text-text-primary">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">{t("checkout.shipping")}</span>
                <span className="text-text-primary">
                  {shipping === 0 ? (
                    <span className="text-success">{t("checkout.free")}</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-text-primary font-semibold">{t("checkout.total")}</span>
                <span className="text-xl font-bold gradient-text">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <Button type="submit" disabled={processing} size="lg" fullWidth className="mt-6">
              {processing ? t("checkout.processing") : `${t("checkout.pay_btn")} ${formatPrice(total)}`}
            </Button>

            <p className="text-xs text-text-muted flex items-center justify-center gap-1.5 mt-4">
              <LucideIcon name="Lock" size={12} className="text-success" /> {t("checkout.secure_payment")}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

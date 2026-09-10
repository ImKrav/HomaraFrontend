"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import AuthCard from "@/app/components/AuthCard";
import { useLanguage } from "@/app/context/LanguageContext";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Opcionales
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const { register, isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/cuenta");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
      });
      router.push("/cuenta");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear la cuenta. Intenta de nuevo.";
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthCard subtitle={t("auth.register_sub")} errorMsg={errorMsg} maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider pb-2 border-b border-border/50">
              {t("auth.register_basic_info")}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("auth.first_name")}
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label={t("auth.last_name")}
                placeholder="Pérez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label={t("auth.email")}
              type="email"
              placeholder="juan@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("auth.password")}
                type="password"
                placeholder={t("auth.password_placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              <Input
                label={t("auth.confirm_password")}
                type="password"
                placeholder={t("auth.repeat_password")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
              />
            </div>

            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider pt-4 pb-2 border-b border-border/50">
              {t("auth.shipping_optional")}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("auth.phone")}
                placeholder="300 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label={t("auth.address")}
                placeholder="Calle 123 # 45-67"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t("auth.city")}
                placeholder="Bogotá"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                label={t("auth.state")}
                placeholder="Cundinamarca"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <Input
                label={t("auth.zip")}
                placeholder="110111"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={submitting}
                className="py-3"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-bg-base border-t-transparent"></span>
                    {t("auth.submit_register_loading")}
                  </span>
                ) : (
                  t("auth.submit_register")
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-sm text-text-secondary">
              {t("auth.has_account")}{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                {t("auth.login_link")}
              </Link>
            </p>
          </div>

    </AuthCard>
  );
}

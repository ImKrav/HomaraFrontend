"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import LucideIcon from "@/app/components/ui/LucideIcon";
import { useLanguage } from "@/app/context/LanguageContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const { login, isAuthenticated, loading } = useAuth();
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
    setSubmitting(true);

    try {
      await login(email, password);
      router.push("/cuenta");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Credenciales incorrectas. Intenta de nuevo.";
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
    <div className="min-h-[85vh] relative flex items-center justify-center px-4 py-16 overflow-hidden bg-bg-base">
      {/* Premium ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-light/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="glass p-8 sm:p-10 rounded-none border border-border/40 shadow-2xl relative">
          
          {/* Decorative Orange Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 gradient-primary" />

          {/* Logo / Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="gradient-text">Homara</span>
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              {t("auth.login_sub")}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-none text-error text-sm flex items-center gap-2 animate-scale-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t("auth.email")}
              type="email"
              id="email"
              name="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <Input
              label={t("auth.password")}
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-text-secondary cursor-pointer">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary/50" />
                {t("auth.remember_me")}
              </label>
              <a href="#" className="text-primary hover:underline font-medium">
                {t("auth.forgot_password")}
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={submitting}
              className="mt-2 py-3"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-bg-base border-t-transparent"></span>
                  {t("auth.submit_login_loading")}
                </span>
              ) : (
                t("auth.submit_login")
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-sm text-text-secondary">
              {t("auth.no_account")}{" "}
              <Link href="/register" className="text-primary hover:underline font-semibold">
                {t("auth.register_link")}
              </Link>
            </p>
          </div>

          {/* Quick login helper block */}
          <div className="mt-6 p-4 bg-bg-surface-light/80 rounded-none border border-border/50 text-xs text-text-secondary">
            <p className="font-semibold text-text-primary mb-2 flex items-center gap-1.5">
              <LucideIcon name="Lightbulb" size={14} className="text-primary shrink-0" />
              {t("auth.demo_access")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="font-bold text-text-primary mb-0.5">{t("auth.demo_client")}</p>
                <p>Email: <span className="font-mono text-primary font-medium">juan@email.com</span></p>
                <p>Clave: <span className="font-mono text-primary font-medium">123456</span></p>
              </div>
              <div>
                <p className="font-bold text-text-primary mb-0.5">{t("auth.demo_admin")}</p>
                <p>Email: <span className="font-mono text-primary font-medium">admin@homara.co</span></p>
                <p>Clave: <span className="font-mono text-primary font-medium">123456</span></p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

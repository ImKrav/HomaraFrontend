"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/app/lib/api";
import { CartItemDetail } from "@/app/lib/utils";
import { useLanguage } from "@/app/context/LanguageContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();

  const navLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.catalog"), href: "/catalogo" },
    { label: t("nav.projects"), href: "/proyectos" },
  ];

  useEffect(() => {
    async function fetchCart() {
      try {
        const json = await api.get("/api/v1/cart");
        if (json.success && json.data && json.data.items) {
          const count = json.data.items.reduce((sum: number, item: CartItemDetail) => sum + item.quantity, 0);
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } catch {
        // Silently handle cart fetch errors
      }
    }
    
    fetchCart();
    
    // Escuchar un evento personalizado por si otros componentes actualizan el carrito
    const handleCartUpdate = () => fetchCart();
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [isAuthenticated]);

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold gradient-text tracking-tight">
              Homara
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 h-full">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface-light rounded-none transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search */}
            <Link
              href="/catalogo"
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-surface-light rounded-none transition-all duration-200"
              aria-label="Buscar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>

            {/* Cart */}
            <Link
              href="/carrito"
              className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-bg-surface-light rounded-none transition-all duration-200"
              aria-label={t("nav.cart")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-bg-base text-[9px] font-bold rounded-none px-1 min-w-[16px] h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account / Dropdown */}
            <div className="relative">
              {isAuthenticated ? (
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 p-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface-light rounded-none transition-all duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-none bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shadow-sm">
                    {user?.firstName?.charAt(0) || "U"}
                  </div>
                  <span className="max-w-[80px] truncate">{user?.firstName}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-surface-light rounded-none transition-all duration-200 flex items-center gap-1.5"
                  aria-label={t("nav.login")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-xs uppercase tracking-wider font-bold">{t("nav.login")}</span>
                </Link>
              )}

              {/* Dropdown Menu */}
              {isAuthenticated && dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-none bg-bg-surface border border-border shadow-xl z-20 py-1.5 animate-scale-in">
                    <div className="px-4 py-2 border-b border-border/60">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                      {t("nav.logged_in_as")} ({user?.role})
                      </p>
                      <p className="text-sm font-bold text-text-primary truncate">{user?.firstName} {user?.lastName}</p>
                    </div>
                    {user?.role?.toUpperCase() === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-primary hover:bg-primary/5 font-bold border-b border-border/60"
                      >
                        {t("nav.admin")}
                      </Link>
                    )}
                    <Link
                      href="/cuenta"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface-light font-medium"
                    >
                      {t("nav.account")}
                    </Link>
                    <Link
                      href="/proyectos"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface-light font-medium"
                    >
                      {t("nav.projects")}
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-error hover:bg-error/5 font-semibold cursor-pointer border-t border-border/40"
                    >
                      {t("nav.logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-none transition-colors"
            aria-label={t("nav.menu")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden animate-slide-down border-t border-border bg-bg-surface">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-surface-light rounded-none transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && user?.role?.toUpperCase() === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 rounded-none transition-colors border-l-2 border-primary pl-3"
              >
                {t("nav.admin")}
              </Link>
            )}
            
            <div className="border-t border-border pt-3 mt-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <Link
                  href="/carrito"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-surface-light rounded-none transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {t("nav.cart")}
                </Link>
                {isAuthenticated ? (
                  <Link
                    href="/cuenta"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-surface-light rounded-none border border-primary/20 bg-primary/5 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-none bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                      {user?.firstName?.charAt(0)}
                    </div>
                    {user?.firstName}
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-surface-light rounded-none transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t("nav.login")}
                  </Link>
                )}
              </div>

              {isAuthenticated && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="w-full py-2.5 px-4 text-center text-xs text-error bg-error/5 rounded-none font-semibold cursor-pointer border border-error/10 mt-2"
                >
                  {t("nav.logout")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}


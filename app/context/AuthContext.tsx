"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  projectCount?: number;
  orderCount?: number;
  createdAt?: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    // La cookie HttpOnly solo la puede borrar el servidor; si la red falla, igual se cierra en la interfaz.
    api.post("/api/v1/users/logout", {}).catch((error) => console.error("Error cerrando sesión:", error));
    setUser(null);
    setLoading(false);
    window.dispatchEvent(new Event("cartUpdated"));
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      // 200 con `data: null` si no hay sesión: un visitante anónimo no provoca un 401 en cada carga.
      const response = await api.get("/api/v1/users/session");
      setUser(response.success && response.data ? response.data : null);
    } catch (error) {
      // DEF-05: un error de red o una petición abortada al navegar no invalida la sesión: se reintenta.
      console.error("Error validando sesión:", error);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    localStorage.removeItem("homara_token"); // token de versiones anteriores (DEF-SEG-FE-02)
    refreshUser();
    window.addEventListener("online", refreshUser);
    return () => window.removeEventListener("online", refreshUser);
  }, [refreshUser]);

  useEffect(() => {
    const handle401 = () => {
      setUser(null);
      setLoading(false);
      router.push("/login");
    };
    window.addEventListener("auth:401", handle401);
    return () => window.removeEventListener("auth:401", handle401);
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post("/api/v1/users/login", { email, password });
      if (response.success && response.data) {
        setUser(response.data.user);
        // Desencadenar recarga del carrito si es necesario
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        throw new Error(response.error || "Error de autenticación");
      }
    } catch (error: unknown) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData: RegisterData) => {
    setLoading(true);
    try {
      const response = await api.post("/api/v1/users/register", formData);
      if (response.success && response.data) {
        setUser(response.data.user);
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        throw new Error(response.error || "Error en el registro");
      }
    } catch (error: unknown) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  }), [user, loading, login, register, logout, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}

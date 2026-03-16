"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────
export type UserRole = "admin" | "medico" | "facturacion" | "recepcion";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clinicId: string;
  clinicName: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  clinicName: string;
  cuit: string;
  provincia: string;
  especialidad: string;
  financiadores: string[];
}

// ─── Permissions ─────────────────────────────────────────────
export type Permission =
  | "pacientes:read"
  | "pacientes:write"
  | "facturacion:read"
  | "facturacion:write"
  | "agenda:read"
  | "agenda:write"
  | "inventario:read"
  | "inventario:write"
  | "reportes:read"
  | "auditoria:read"
  | "configuracion:read"
  | "configuracion:write"
  | "equipo:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "pacientes:read",
    "pacientes:write",
    "facturacion:read",
    "facturacion:write",
    "agenda:read",
    "agenda:write",
    "inventario:read",
    "inventario:write",
    "reportes:read",
    "auditoria:read",
    "configuracion:read",
    "configuracion:write",
    "equipo:manage",
  ],
  medico: [
    "pacientes:read",
    "pacientes:write",
    "agenda:read",
    "agenda:write",
    "reportes:read",
    "auditoria:read",
  ],
  facturacion: [
    "pacientes:read",
    "facturacion:read",
    "facturacion:write",
    "reportes:read",
    "auditoria:read",
    "inventario:read",
  ],
  recepcion: [
    "pacientes:read",
    "pacientes:write",
    "agenda:read",
    "agenda:write",
    "inventario:read",
  ],
};

// ─── Demo user ───────────────────────────────────────────────
// Removed — demo user is now managed server-side in /api/auth/session

// ─── Context ─────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // ── Check session on mount (reads httpOnly cookie via API) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (!res.ok) throw new Error("Session fetch failed");
        const { user } = await res.json();
        if (!cancelled) {
          setState({
            user: user ?? null,
            isLoading: false,
            isAuthenticated: !!user,
          });
        }
      } catch {
        if (!cancelled) {
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Login via server-side session ──
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, action: "login" }),
      });

      const data = await res.json();

      if (!res.ok || !data.user) {
        return { success: false, error: data.error ?? "Error al iniciar sesión" };
      }

      setState({ user: data.user, isLoading: false, isAuthenticated: true });
      return { success: true };
    } catch {
      return { success: false, error: "Error de conexión" };
    }
  }, []);

  // ── Register via server-side session ──
  const register = useCallback(async (data: RegisterData) => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          clinicName: data.clinicName,
          action: "register",
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.user) {
        return { success: false, error: result.error ?? "Error al registrarse" };
      }

      setState({ user: result.user, isLoading: false, isAuthenticated: true });
      return { success: true };
    } catch {
      return { success: false, error: "Error de conexión" };
    }
  }, []);

  // ── Logout (server clears httpOnly cookie) ──
  // SM-03: Also clear Google OAuth cookies
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      // Best-effort; clear local state regardless
    }
    // SM-03: Clear Google cookies (non-httpOnly ones clearable from client)
    document.cookie = "condor_google_user=; path=/; max-age=0";
    document.cookie = "condor_google_session=; path=/; max-age=0";
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!state.user) return false;
      return ROLE_PERMISSIONS[state.user.role].includes(permission);
    },
    [state.user],
  );

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useUser() {
  const { user } = useAuth();
  if (!user) throw new Error("useUser called without authenticated user");
  return user;
}

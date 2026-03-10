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
    "pacientes:read", "pacientes:write",
    "facturacion:read", "facturacion:write",
    "agenda:read", "agenda:write",
    "inventario:read", "inventario:write",
    "reportes:read", "auditoria:read",
    "configuracion:read", "configuracion:write",
    "equipo:manage",
  ],
  medico: [
    "pacientes:read", "pacientes:write",
    "agenda:read", "agenda:write",
    "reportes:read", "auditoria:read",
  ],
  facturacion: [
    "pacientes:read",
    "facturacion:read", "facturacion:write",
    "reportes:read", "auditoria:read",
    "inventario:read",
  ],
  recepcion: [
    "pacientes:read", "pacientes:write",
    "agenda:read", "agenda:write",
    "inventario:read",
  ],
};

// ─── Demo user ───────────────────────────────────────────────
const DEMO_USER: User = {
  id: "demo-001",
  email: "demo@condorsalud.com",
  name: "Dr. Martín Rodríguez",
  role: "admin",
  clinicId: "clinic-001",
  clinicName: "Centro Médico Sur",
};

// ─── Context ─────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSupabaseConfigured = () =>
  typeof window !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project.supabase.co";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check session on mount
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("condor_session") : null;
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        setState({ user, isLoading: false, isAuthenticated: true });
      } catch {
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } else {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    if (isSupabaseConfigured()) {
      // TODO: Wire to Supabase Auth when credentials available
      // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    }

    // Demo mode: accept any valid-looking credentials
    const demoUser: User = { ...DEMO_USER, email };
    localStorage.setItem("condor_session", JSON.stringify(demoUser));
    setState({ user: demoUser, isLoading: false, isAuthenticated: true });
    return { success: true };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    if (isSupabaseConfigured()) {
      // TODO: Wire to Supabase Auth
    }

    const newUser: User = {
      ...DEMO_USER,
      email: data.email,
      name: data.name,
      clinicName: data.clinicName,
    };
    localStorage.setItem("condor_session", JSON.stringify(newUser));
    setState({ user: newUser, isLoading: false, isAuthenticated: true });
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem("condor_session");
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

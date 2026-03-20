"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { WA_NUMBER } from "@/components/DemoModal";
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Building2,
  Package,
  Calendar,
  Shield,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

// ─── Demo sidebar nav ────────────────────────────────────────

const demoNav = [
  { label: "Panel", href: "/demo", icon: LayoutDashboard },
  { label: "Facturación", href: "/demo/facturacion", icon: FileText },
  { label: "Rechazos", href: "/demo/rechazos", icon: AlertTriangle },
  { label: "Pacientes", href: "/demo/pacientes", icon: Users },
  { label: "Inventario", href: "/demo/inventario", icon: Package },
  { label: "Financiadores", href: "/demo/financiadores", icon: Building2 },
  { label: "Agenda", href: "/demo/agenda", icon: Calendar },
  { label: "Auditoría", href: "/demo/auditoria", icon: Shield },
];

export default function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => setSidebarOpen(false), [pathname]);

  const waMsg = encodeURIComponent(
    "Hola, vi la demo de Cóndor Salud y me interesa activar mi clínica.",
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/condor.png"
              alt="Cóndor Salud"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
            <div className="font-display font-bold text-base">
              <span className="text-celeste-dark">CÓNDOR </span>
              <span className="text-gold">SALUD</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo badge */}
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-bold text-amber-700">MODO DEMO</span>
          </div>
          <p className="text-[10px] text-amber-600 mt-0.5 leading-relaxed">
            Datos ficticios de ejemplo
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          <div className="space-y-0.5">
            {demoNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition ${
                    active
                      ? "bg-celeste-50 text-celeste-dark font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom CTA */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          <Link
            href="/auth/registro"
            className="block w-full text-center px-4 py-2.5 text-xs font-semibold bg-celeste-dark text-white rounded-lg hover:bg-celeste transition"
          >
            Crear cuenta gratis
          </Link>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:border-celeste hover:text-celeste-dark transition"
          >
            Hablar con ventas
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top banner */}
        <div className="bg-gradient-to-r from-celeste-dark to-celeste px-4 py-2.5 text-center text-white text-xs flex items-center justify-center gap-3 shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            Estás viendo la <strong>demo interactiva</strong> con datos ficticios.
          </span>
          <Link
            href="/auth/registro"
            className="px-3 py-1 bg-white text-celeste-dark font-semibold rounded text-[11px] hover:bg-celeste-50 transition"
          >
            Activar mi clínica →
          </Link>
        </div>

        {/* Top bar */}
        <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-ink-light hover:text-ink transition"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm text-ink-light hidden sm:block">Demo — Centro Médico Ejemplo</div>
          <div className="flex items-center gap-3 ml-auto">
            <Link
              href="/auth/registro"
              className="text-xs font-medium text-celeste-dark hover:underline hidden sm:inline"
            >
              Crear cuenta
            </Link>
            <Link href="/auth/login" className="text-xs text-ink-muted hover:text-ink transition">
              Iniciar sesión
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

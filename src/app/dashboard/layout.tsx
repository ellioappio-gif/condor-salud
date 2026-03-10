"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/Toast";

const navSections = [
  {
    title: null,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "📊" },
    ],
  },
  {
    title: "GESTIÓN CLÍNICA",
    items: [
      { label: "Pacientes", href: "/dashboard/pacientes", icon: "👥" },
      { label: "Agenda", href: "/dashboard/agenda", icon: "📅" },
      { label: "Verificación", href: "/dashboard/verificacion", icon: "🔍" },
      { label: "Inventario", href: "/dashboard/inventario", icon: "📦" },
    ],
  },
  {
    title: "FINANZAS",
    items: [
      { label: "Facturación", href: "/dashboard/facturacion", icon: "📄" },
      { label: "Rechazos", href: "/dashboard/rechazos", icon: "⚠️" },
      { label: "Financiadores", href: "/dashboard/financiadores", icon: "🏛️" },
      { label: "Inflación", href: "/dashboard/inflacion", icon: "📈" },
    ],
  },
  {
    title: "INTELIGENCIA",
    items: [
      { label: "Auditoría", href: "/dashboard/auditoria", icon: "🛡️" },
      { label: "Nomenclador", href: "/dashboard/nomenclador", icon: "🏷️" },
      { label: "Reportes", href: "/dashboard/reportes", icon: "📋" },
    ],
  },
  {
    title: "SISTEMA",
    items: [
      { label: "Alertas", href: "/dashboard/alertas", icon: "🔔", badge: 5 },
      { label: "Configuración", href: "/dashboard/configuracion", icon: "⚙️" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-ink flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img src="/logos/condor.png" alt="Cóndor Salud" className="w-9 h-9 object-contain" />
            <div>
              <div className="font-bold text-sm text-celeste-light tracking-[2px] leading-none">
                CÓNDOR
              </div>
              <div className="text-[8px] font-bold text-gold tracking-[0.2em] leading-none">
                S A L U D
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          {navSections.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-5" : ""}>
              {section.title && (
                <div className="px-3 mb-2 text-[9px] font-bold tracking-[0.16em] text-white/25 uppercase">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded text-[13px] transition ${
                        active
                          ? "bg-celeste-dark/20 text-white font-medium"
                          : "text-ink-muted hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="text-sm w-5 text-center">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {"badge" in item && item.badge ? (
                        <span className="bg-gold text-ink text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-3 border-t border-white/10">
          <Link href="/dashboard/configuracion/equipo" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-celeste-dark/30 flex items-center justify-center text-celeste-light font-bold text-xs">
              DR
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/80 font-medium truncate group-hover:text-white transition">Dr. Rodríguez</div>
              <div className="text-[10px] text-ink-muted/60 truncate">Clínica San Martín · Growth</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-white flex items-center justify-between px-6 shrink-0">
          <div className="text-sm text-ink-light">
            {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/alertas" className="relative text-ink-muted hover:text-ink transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-ink text-[8px] font-bold rounded-full flex items-center justify-center">5</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <Link href="/dashboard/configuracion" className="flex items-center gap-2.5 group">
              <span className="text-xs text-ink-muted group-hover:text-ink transition">Dr. Martín Rodríguez</span>
              <div className="w-8 h-8 rounded-full bg-celeste-pale flex items-center justify-center text-celeste-dark font-bold text-xs">
                MR
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFB] p-6">
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>
      </div>
    </div>
  );
}

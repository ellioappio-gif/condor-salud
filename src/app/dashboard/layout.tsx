"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Verificación", href: "/dashboard/verificacion", icon: "🔍" },
  { label: "Facturación", href: "/dashboard/facturacion", icon: "📄" },
  { label: "Rechazos", href: "/dashboard/rechazos", icon: "⚠️" },
  { label: "Financiadores", href: "/dashboard/financiadores", icon: "🏛️" },
  { label: "Inflación", href: "/dashboard/inflacion", icon: "📈" },
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
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition ${
                  active
                    ? "bg-celeste-dark/20 text-white font-medium"
                    : "text-ink-muted hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="text-xs text-ink-muted">Clínica Demo</div>
          <div className="text-[10px] text-ink-muted/60">Plan Growth · CABA</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-white flex items-center justify-between px-6 shrink-0">
          <div className="text-sm text-ink-light">
            {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted">demo@clinica.com</span>
            <div className="w-8 h-8 rounded-full bg-celeste-pale flex items-center justify-center text-celeste-dark font-bold text-xs">
              D
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFB] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

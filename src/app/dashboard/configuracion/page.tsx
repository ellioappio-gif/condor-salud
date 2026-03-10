"use client";
import Link from "next/link";

const sections = [
  { title: "Mi Clínica", desc: "Datos de la clínica, logo, dirección, CUIT, información fiscal y de contacto.", href: "/dashboard/configuracion/clinica", icon: "🏥", badge: null },
  { title: "Equipo", desc: "Gestión de usuarios, roles, permisos y profesionales del equipo médico.", href: "/dashboard/configuracion/equipo", icon: "👥", badge: "4 usuarios" },
  { title: "Integraciones", desc: "Conexiones con PAMI, AFIP, obras sociales y servicios externos.", href: "/dashboard/configuracion/integraciones", icon: "🔗", badge: "6 activas" },
  { title: "Facturación & Plan", desc: "Tu suscripción actual, historial de pagos y configuración de facturación.", href: "/dashboard/configuracion/facturacion", icon: "💳", badge: "Plan Pro" },
  { title: "Nomenclador", desc: "Configuración de códigos, módulos y valores personalizados.", href: "/dashboard/nomenclador", icon: "📋", badge: null },
  { title: "Notificaciones", desc: "Preferencias de alertas por email, push y frecuencia de reportes.", href: "/dashboard/configuracion/notificaciones", icon: "🔔", badge: null },
];

export default function ConfiguracionPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Configuración</h1>
        <p className="text-sm text-ink-muted mt-0.5">Ajustes generales de la clínica y la plataforma</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link key={s.title} href={s.href} className="bg-white border border-border rounded-lg p-5 hover:shadow-md hover:-translate-y-0.5 transition group block">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              {s.badge && <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider rounded bg-celeste-pale text-celeste-dark">{s.badge}</span>}
            </div>
            <h3 className="text-sm font-bold text-ink mb-1 group-hover:text-celeste-dark transition">{s.title}</h3>
            <p className="text-xs text-ink-muted leading-relaxed">{s.desc}</p>
            <span className="text-xs text-celeste-dark font-medium mt-3 inline-block group-hover:underline">Configurar →</span>
          </Link>
        ))}
      </div>

      {/* Quick info */}
      <div className="bg-celeste-pale/30 border border-border rounded-lg p-5">
        <div className="grid sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">Clínica</p>
            <p className="font-semibold text-ink mt-0.5">Centro Médico San Martín</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">CUIT</p>
            <p className="font-mono text-ink mt-0.5">30-71234567-8</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">Plan</p>
            <p className="font-semibold text-celeste-dark mt-0.5">Pro — $75.000/mes</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">Próx. facturación</p>
            <p className="font-semibold text-ink mt-0.5">01/04/2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";

interface Integracion {
  id: string;
  nombre: string;
  tipo: string;
  estado: "Conectado" | "Error" | "Desconectado" | "Pendiente";
  ultimaSync: string;
  descripcion: string;
  icon: string;
}

const integraciones: Integracion[] = [
  { id: "INT-01", nombre: "PAMI — Webservice", tipo: "Obra Social", estado: "Conectado", ultimaSync: "07/03/2026 16:00", descripcion: "Presentación electrónica de facturación, verificación de cobertura y consulta de aranceles.", icon: "🏥" },
  { id: "INT-02", nombre: "AFIP — Factura Electrónica", tipo: "Fiscal", estado: "Conectado", ultimaSync: "07/03/2026 14:30", descripcion: "Emisión de comprobantes electrónicos (Factura C, Nota de Crédito/Débito) vía webservice WSFE.", icon: "🏛" },
  { id: "INT-03", nombre: "Swiss Medical — API", tipo: "Obra Social", estado: "Conectado", ultimaSync: "06/03/2026 22:00", descripcion: "Autorizaciones online, verificación de cobertura y envío electrónico de facturas.", icon: "🔗" },
  { id: "INT-04", nombre: "OSDE — Portal Prestadores", tipo: "Obra Social", estado: "Conectado", ultimaSync: "06/03/2026 23:00", descripcion: "Presentación electrónica, consulta de pagos y verificación de afiliados.", icon: "🔗" },
  { id: "INT-05", nombre: "Galeno — Webservice", tipo: "Obra Social", estado: "Error", ultimaSync: "04/03/2026 10:15", descripcion: "Conexión intermitente. Último error: Timeout en autenticación. Reintentando automáticamente.", icon: "⚠️" },
  { id: "INT-06", nombre: "WhatsApp Business — Turnos", tipo: "Comunicación", estado: "Conectado", ultimaSync: "07/03/2026 17:00", descripcion: "Recordatorios automáticos de turnos, confirmación por mensaje y notificaciones al paciente.", icon: "💬" },
  { id: "INT-07", nombre: "IOMA — Portal Web", tipo: "Obra Social", estado: "Desconectado", ultimaSync: "—", descripcion: "Integración pendiente de configuración. Actualmente se gestiona manualmente.", icon: "🔌" },
  { id: "INT-08", nombre: "Medifé — API Prestadores", tipo: "Obra Social", estado: "Pendiente", ultimaSync: "—", descripcion: "En proceso de habilitación. Esperando credenciales de producción.", icon: "⏳" },
];

const estadoColors: Record<string, string> = {
  Conectado: "bg-green-50 text-green-700 border-green-200",
  Error: "bg-red-50 text-red-600 border-red-200",
  Desconectado: "bg-gray-100 text-ink-muted border-gray-200",
  Pendiente: "bg-gold-pale text-[#B8860B] border-gold",
};

export default function IntegracionesPage() {
  const activas = integraciones.filter((i) => i.estado === "Conectado").length;
  const errores = integraciones.filter((i) => i.estado === "Error").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <Link href="/dashboard/configuracion" className="hover:text-celeste-dark transition">Configuración</Link>
        <span>/</span>
        <span className="text-ink font-medium">Integraciones</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Integraciones</h1>
          <p className="text-sm text-ink-muted mt-0.5">{activas} activas · {errores} con error</p>
        </div>
        <button className="px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition">+ Nueva integración</button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: integraciones.length, color: "border-celeste" },
          { label: "Conectadas", value: activas, color: "border-green-400" },
          { label: "Con error", value: errores, color: "border-red-400" },
          { label: "Pendientes", value: integraciones.filter((i) => i.estado === "Pendiente" || i.estado === "Desconectado").length, color: "border-gold" },
        ].map((k) => (
          <div key={k.label} className={`bg-white border border-border rounded-lg p-4 border-l-[3px] ${k.color}`}>
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">{k.label}</p>
            <p className="text-xl font-bold text-ink mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {errores > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-red-500 text-lg">⚠</span>
          <div>
            <p className="text-sm font-semibold text-red-700">{errores} integración con error</p>
            <p className="text-xs text-red-600 mt-0.5">{integraciones.filter((i) => i.estado === "Error").map((i) => i.nombre).join(", ")}</p>
          </div>
        </div>
      )}

      {/* Integration cards */}
      <div className="space-y-3">
        {integraciones.map((int) => (
          <div key={int.id} className={`bg-white border rounded-lg p-5 transition hover:shadow-sm ${int.estado === "Error" ? "border-red-200" : "border-border"}`}>
            <div className="flex items-start gap-4">
              <span className="text-2xl">{int.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-bold text-ink">{int.nombre}</h3>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${estadoColors[int.estado]}`}>{int.estado}</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider rounded bg-[#F8FAFB] text-ink-muted">{int.tipo}</span>
                </div>
                <p className="text-xs text-ink-light leading-relaxed">{int.descripcion}</p>
                <p className="text-[10px] text-ink-muted mt-1.5">Última sincronización: {int.ultimaSync}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {int.estado === "Conectado" && (
                  <button className="px-3 py-1.5 text-xs font-medium border border-border rounded-[4px] text-ink-light hover:border-celeste-dark hover:text-celeste-dark transition">Sincronizar</button>
                )}
                {int.estado === "Error" && (
                  <button className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-[4px] hover:bg-red-700 transition">Reintentar</button>
                )}
                {(int.estado === "Desconectado" || int.estado === "Pendiente") && (
                  <button className="px-3 py-1.5 text-xs font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition">Configurar</button>
                )}
                <button className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition">Ajustes</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

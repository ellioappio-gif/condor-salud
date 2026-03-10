import Link from "next/link";
const kpis = [
  { label: "Facturado este mes", value: "$4.2M", change: "+12%", up: true, color: "text-celeste-dark", href: "/dashboard/facturacion" },
  { label: "Cobrado", value: "$3.1M", change: "74% del facturado", up: true, color: "text-celeste-dark", href: "/dashboard/financiadores" },
  { label: "Rechazos PAMI", value: "8.2%", change: "-3.1% vs. mes ant.", up: false, color: "text-gold", href: "/dashboard/rechazos" },
  { label: "Pérdida por inflación", value: "$320K", change: "7.6% del cobrado", up: false, color: "text-gold", href: "/dashboard/inflacion" },
];

const financiadores = [
  { name: "PAMI", facturado: "$1.4M", cobrado: "$980K", rechazo: "12%", dias: "68" },
  { name: "OSDE", facturado: "$890K", cobrado: "$845K", rechazo: "4%", dias: "32" },
  { name: "Swiss Medical", facturado: "$620K", cobrado: "$595K", rechazo: "2%", dias: "28" },
  { name: "IOMA", facturado: "$410K", cobrado: "$312K", rechazo: "18%", dias: "82" },
  { name: "Galeno", facturado: "$280K", cobrado: "$268K", rechazo: "3%", dias: "35" },
];

const quickLinks = [
  { label: "Pacientes", desc: "847 activos", href: "/dashboard/pacientes", icon: "👥" },
  { label: "Agenda", desc: "16 turnos hoy", href: "/dashboard/agenda", icon: "📅" },
  { label: "Auditoría", desc: "5 pendientes", href: "/dashboard/auditoria", icon: "🔍" },
  { label: "Inventario", desc: "3 críticos", href: "/dashboard/inventario", icon: "📦" },
  { label: "Nomenclador", desc: "18 códigos", href: "/dashboard/nomenclador", icon: "📋" },
  { label: "Reportes", desc: "10 disponibles", href: "/dashboard/reportes", icon: "📊" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      {/* Page title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted mt-0.5">Vista ejecutiva · Centro Médico San Martín</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/reportes" className="px-4 py-2 text-sm font-medium border border-border rounded-[4px] text-ink-light hover:border-celeste-dark hover:text-celeste-dark transition">Generar reporte</Link>
          <Link href="/dashboard/facturacion" className="px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition">Ver facturación</Link>
        </div>
      </div>

      {/* KPI cards — clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="bg-white border border-border rounded-lg p-5 hover:shadow-md hover:-translate-y-0.5 transition group block">
            <div className="text-[10px] font-bold tracking-wider text-ink-muted uppercase mb-1">{kpi.label}</div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className={`text-xs mt-1 ${kpi.up ? "text-green-600" : "text-ink-muted"}`}>
              {kpi.change}
            </div>
            <span className="text-[10px] text-celeste-dark font-medium mt-2 inline-block opacity-0 group-hover:opacity-100 transition">Ver detalle →</span>
          </Link>
        ))}
      </div>

      {/* Quick access grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickLinks.map((q) => (
          <Link key={q.label} href={q.href} className="bg-white border border-border rounded-lg p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition group block">
            <span className="text-2xl block mb-1">{q.icon}</span>
            <p className="text-xs font-bold text-ink group-hover:text-celeste-dark transition">{q.label}</p>
            <p className="text-[10px] text-ink-muted">{q.desc}</p>
          </Link>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart placeholder */}
        <div className="lg:col-span-2 bg-white border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-ink-muted">Ingresos vs. cobros (últimos 6 meses)</div>
            <Link href="/dashboard/financiadores" className="text-[10px] text-celeste-dark font-medium hover:underline">Ver financiadores →</Link>
          </div>
          <div className="h-48 flex items-end gap-3 px-4">
            {[40, 55, 48, 62, 58, 72].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5">
                  <div className="flex-1 bg-celeste rounded-t" style={{ height: `${h * 2.5}px` }} />
                  <div className="flex-1 bg-celeste-light rounded-t" style={{ height: `${h * 1.9}px` }} />
                </div>
                <span className="text-[10px] text-ink-muted">M{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-ink-muted">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-celeste rounded-sm" /> Facturado</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-celeste-light rounded-sm" /> Cobrado</span>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-ink-muted">Alertas recientes</div>
            <Link href="/dashboard/alertas" className="text-[10px] text-celeste-dark font-medium hover:underline">Ver todas →</Link>
          </div>
          <div className="space-y-3">
            <Link href="/dashboard/rechazos" className="block border-l-2 border-gold pl-3 py-1 hover:bg-gold-pale/30 transition rounded-r">
              <div className="text-xs font-semibold text-ink">5 rechazos IOMA nuevos</div>
              <div className="text-[10px] text-ink-muted">Hace 2 horas · Error de código</div>
            </Link>
            <Link href="/dashboard/facturacion" className="block border-l-2 border-celeste pl-3 py-1 hover:bg-celeste-pale/30 transition rounded-r">
              <div className="text-xs font-semibold text-ink">Vence presentación PAMI</div>
              <div className="text-[10px] text-ink-muted">En 3 días · 12 facturas pendientes</div>
            </Link>
            <Link href="/dashboard/nomenclador" className="block border-l-2 border-gold pl-3 py-1 hover:bg-gold-pale/30 transition rounded-r">
              <div className="text-xs font-semibold text-ink">Nomenclador SSS actualizado</div>
              <div className="text-[10px] text-ink-muted">Ayer · 14 códigos modificados</div>
            </Link>
            <Link href="/dashboard/financiadores" className="block border-l-2 border-celeste pl-3 py-1 hover:bg-celeste-pale/30 transition rounded-r">
              <div className="text-xs font-semibold text-ink">Swiss Medical pagó lote</div>
              <div className="text-[10px] text-ink-muted">Hoy · $595K acreditados</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Financiadores table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="text-xs text-ink-muted">Rendimiento por financiador</div>
          <Link href="/dashboard/financiadores" className="text-[10px] text-celeste-dark font-medium hover:underline">Análisis completo →</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFB] text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              <th className="text-left px-5 py-2.5">Financiador</th>
              <th className="text-right px-5 py-2.5">Facturado</th>
              <th className="text-right px-5 py-2.5">Cobrado</th>
              <th className="text-right px-5 py-2.5">Rechazo</th>
              <th className="text-right px-5 py-2.5">Días pago</th>
            </tr>
          </thead>
          <tbody>
            {financiadores.map((f) => (
              <tr key={f.name} className="border-t border-border-light hover:bg-celeste-pale/30 transition cursor-pointer">
                <td className="px-5 py-3 font-semibold text-ink">{f.name}</td>
                <td className="px-5 py-3 text-right text-ink-light">{f.facturado}</td>
                <td className="px-5 py-3 text-right text-ink-light">{f.cobrado}</td>
                <td className={`px-5 py-3 text-right font-semibold ${
                  parseFloat(f.rechazo) > 10 ? "text-red-500" : parseFloat(f.rechazo) > 5 ? "text-gold" : "text-green-600"
                }`}>
                  {f.rechazo}
                </td>
                <td className={`px-5 py-3 text-right ${
                  parseInt(f.dias) > 60 ? "text-red-500 font-semibold" : "text-ink-light"
                }`}>
                  {f.dias}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Today's activity */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase">Agenda de Hoy</h3>
            <Link href="/dashboard/agenda" className="text-[10px] text-celeste-dark font-medium hover:underline">Ver agenda →</Link>
          </div>
          <div className="space-y-2">
            {[
              { hora: "08:00", pac: "González, María Elena", tipo: "Control", estado: "Confirmado" },
              { hora: "08:30", pac: "López, Juan Carlos", tipo: "Consulta", estado: "Confirmado" },
              { hora: "09:00", pac: "Ramírez, Sofía", tipo: "Primera vez", estado: "Pendiente" },
              { hora: "10:00", pac: "Díaz, Roberto", tipo: "Ecografía", estado: "En espera" },
            ].map((t, i) => (
              <Link key={i} href="/dashboard/pacientes/P001" className="flex items-center gap-3 py-2 border-b border-border-light last:border-0 hover:bg-celeste-pale/30 transition rounded px-2 -mx-2 block">
                <span className="font-mono text-[10px] text-ink-muted w-10">{t.hora}</span>
                <span className="text-xs font-semibold text-ink flex-1">{t.pac}</span>
                <span className="text-[10px] text-ink-light">{t.tipo}</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${t.estado === "Confirmado" ? "bg-green-50 text-green-700" : t.estado === "Pendiente" ? "bg-gold-pale text-[#B8860B]" : "bg-celeste-pale text-celeste-dark"}`}>{t.estado}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase">Auditoría Pendiente</h3>
            <Link href="/dashboard/auditoria" className="text-[10px] text-celeste-dark font-medium hover:underline">Ver auditoría →</Link>
          </div>
          <div className="space-y-2">
            {[
              { tipo: "Código incorrecto", sev: "Alta", pac: "González — PAMI", monto: "$24.600" },
              { tipo: "Autorización vencida", sev: "Alta", pac: "Ramírez — Swiss Med.", monto: "$65.000" },
              { tipo: "Duplicado potencial", sev: "Media", pac: "Morales — Galeno", monto: "$32.000" },
              { tipo: "Tope superado", sev: "Alta", pac: "Romero — Medifé", monto: "$42.300" },
            ].map((a, i) => (
              <Link key={i} href="/dashboard/auditoria" className="flex items-center gap-3 py-2 border-b border-border-light last:border-0 hover:bg-celeste-pale/30 transition rounded px-2 -mx-2 block">
                <span className={`w-2 h-2 rounded-full ${a.sev === "Alta" ? "bg-red-500" : "bg-gold"}`} />
                <span className="text-xs font-semibold text-ink flex-1">{a.tipo}</span>
                <span className="text-[10px] text-ink-light">{a.pac}</span>
                <span className="text-[10px] font-bold text-ink">{a.monto}</span>
              </Link>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border-light text-center">
            <span className="text-xs text-ink-muted">Monto en riesgo: <strong className="text-red-600">$163.900</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

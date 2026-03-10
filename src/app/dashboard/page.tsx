const kpis = [
  { label: "Facturado este mes", value: "$4.2M", change: "+12%", up: true, color: "text-celeste-dark" },
  { label: "Cobrado", value: "$3.1M", change: "74% del facturado", up: true, color: "text-celeste-dark" },
  { label: "Rechazos PAMI", value: "8.2%", change: "-3.1% vs. mes ant.", up: false, color: "text-gold" },
  { label: "Pérdida por inflación", value: "$320K", change: "7.6% del cobrado", up: false, color: "text-gold" },
];

const financiadores = [
  { name: "PAMI", facturado: "$1.4M", cobrado: "$980K", rechazo: "12%", dias: "68" },
  { name: "OSDE", facturado: "$890K", cobrado: "$845K", rechazo: "4%", dias: "32" },
  { name: "Swiss Medical", facturado: "$620K", cobrado: "$595K", rechazo: "2%", dias: "28" },
  { name: "IOMA", facturado: "$410K", cobrado: "$312K", rechazo: "18%", dias: "82" },
  { name: "Galeno", facturado: "$280K", cobrado: "$268K", rechazo: "3%", dias: "35" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted mt-1">Vista ejecutiva de tu clínica</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-border rounded-lg p-5">
            <div className="text-xs text-ink-muted mb-1">{kpi.label}</div>
            <div className={`text-2xl font-display font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className={`text-xs mt-1 ${kpi.up ? "text-green-600" : "text-ink-muted"}`}>
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart placeholder */}
        <div className="lg:col-span-2 bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-ink-muted mb-4">Ingresos vs. cobros (últimos 6 meses)</div>
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
          <div className="text-xs text-ink-muted mb-3">Alertas recientes</div>
          <div className="space-y-3">
            <div className="border-l-2 border-gold pl-3 py-1">
              <div className="text-xs font-semibold text-ink">5 rechazos IOMA nuevos</div>
              <div className="text-[10px] text-ink-muted">Hace 2 horas · Error de código</div>
            </div>
            <div className="border-l-2 border-celeste pl-3 py-1">
              <div className="text-xs font-semibold text-ink">Vence presentación PAMI</div>
              <div className="text-[10px] text-ink-muted">En 3 días · 12 facturas pendientes</div>
            </div>
            <div className="border-l-2 border-gold pl-3 py-1">
              <div className="text-xs font-semibold text-ink">Nomenclador SSS actualizado</div>
              <div className="text-[10px] text-ink-muted">Ayer · 14 códigos modificados</div>
            </div>
            <div className="border-l-2 border-celeste pl-3 py-1">
              <div className="text-xs font-semibold text-ink">Swiss Medical pagó lote</div>
              <div className="text-[10px] text-ink-muted">Hoy · $595K acreditados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Financiadores table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="text-xs text-ink-muted">Rendimiento por financiador</div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFB] text-xs text-ink-muted">
              <th className="text-left font-medium px-5 py-3">Financiador</th>
              <th className="text-right font-medium px-5 py-3">Facturado</th>
              <th className="text-right font-medium px-5 py-3">Cobrado</th>
              <th className="text-right font-medium px-5 py-3">Rechazo</th>
              <th className="text-right font-medium px-5 py-3">Días pago</th>
            </tr>
          </thead>
          <tbody>
            {financiadores.map((f) => (
              <tr key={f.name} className="border-t border-border-light hover:bg-celeste-pale/30 transition">
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
    </div>
  );
}

const tiers = [
  { name: "Starter", price: "$25K", period: "ARS/mes · 1 sede · 2 financiadores", desc: "Dashboard básico. PAMI + 1 obra social. Reporte mensual. Target: consultorios individuales.", featured: false },
  { name: "Growth", price: "$75K", period: "ARS/mes · 3 sedes · 5 financiadores", desc: "Inteligencia completa. Tracker de inflación. Gestión de rechazos. Alertas semanales. Onboarding. El tier más popular.", featured: true },
  { name: "Scale", price: "$180K", period: "ARS/mes · ilimitado · todos los financiadores", desc: "Benchmarking multi-sede. Analytics por proveedor. Reportes custom para directorio. Business review trimestral.", featured: false },
  { name: "Enterprise", price: "Custom", period: "Contrato anual", desc: "Todo lo anterior + integraciones a medida. SLA garantizado. Implementación dedicada. Target: cadenas, sanatorios.", featured: false },
];

export default function Pricing() {
  return (
    <section id="pricing" className="px-6 py-20 border-t border-border">
      <div className="max-w-[900px] mx-auto">
        <p className="text-[11px] font-bold tracking-[2px] text-celeste uppercase mb-2.5">Pricing</p>
        <h2 className="text-[clamp(24px,3vw,36px)] font-bold text-ink mb-4 leading-[1.2]">
          Precio en pesos con ajuste mensual IPC
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`text-center p-7 transition hover:-translate-y-0.5 ${
                t.featured
                  ? "border-2 border-celeste bg-celeste-pale"
                  : "border border-border"
              }`}
            >
              <div className="text-[10px] font-bold tracking-[0.12em] text-ink-muted uppercase mb-2">
                {t.name}
              </div>
              <div
                className={`text-[30px] font-bold ${
                  t.featured ? "text-celeste-dark" : "text-ink"
                }`}
              >
                {t.price}
              </div>
              <div className="text-xs text-ink-muted mb-4">{t.period}</div>
              <p className="text-[13px] text-ink-light leading-relaxed text-left">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

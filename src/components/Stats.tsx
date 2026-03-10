const stats = [
  { value: "300+", label: "Financiadores sin conectar" },
  { value: "8–25%", label: "Tasa de rechazo promedio" },
  { value: "45–90", label: "Días de demora de pago" },
  { value: "8–15%", label: "Pérdida real por inflación" },
];

export default function Stats() {
  return (
    <div className="max-w-[900px] mx-auto mb-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
      {stats.map((s) => (
        <div key={s.label} className="bg-white py-7 px-5 text-center">
          <div className="text-[28px] font-bold text-celeste-dark">{s.value}</div>
          <div className="text-xs text-ink-muted mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

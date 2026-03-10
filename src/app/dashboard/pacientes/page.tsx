"use client";
import { useState } from "react";
import Link from "next/link";

const pacientes = [
  { id: "P001", nombre: "María Elena", apellido: "González", dni: "27.845.332", edad: 67, sexo: "F", financiador: "PAMI", plan: "Básico", telefono: "11-4523-8891", email: "maria.gonzalez@gmail.com", ultimaVisita: "07/03/2026", estado: "activo", turnos: 3 },
  { id: "P002", nombre: "Jorge Alberto", apellido: "Fernández", dni: "20.112.485", edad: 54, sexo: "M", financiador: "OSDE 310", plan: "310", telefono: "11-5567-2234", email: "jfernandez@outlook.com", ultimaVisita: "05/03/2026", estado: "activo", turnos: 1 },
  { id: "P003", nombre: "Lucía", apellido: "Martínez", dni: "35.678.901", edad: 32, sexo: "F", financiador: "Swiss Medical", plan: "SMG 30", telefono: "11-3345-6789", email: "lucia.mtz@gmail.com", ultimaVisita: "01/03/2026", estado: "activo", turnos: 2 },
  { id: "P004", nombre: "Carlos Raúl", apellido: "López", dni: "14.567.890", edad: 72, sexo: "M", financiador: "PAMI", plan: "Básico", telefono: "11-4412-3356", email: null, ultimaVisita: "28/02/2026", estado: "activo", turnos: 5 },
  { id: "P005", nombre: "Ana Sofía", apellido: "Russo", dni: "38.901.234", edad: 28, sexo: "F", financiador: "Galeno", plan: "Azul", telefono: "11-6678-4455", email: "anarusso@live.com", ultimaVisita: "06/03/2026", estado: "activo", turnos: 1 },
  { id: "P006", nombre: "Roberto", apellido: "Díaz", dni: "18.234.567", edad: 61, sexo: "M", financiador: "IOMA", plan: "Obligatorio", telefono: "221-445-6677", email: "rdiaz@yahoo.com.ar", ultimaVisita: "04/03/2026", estado: "activo", turnos: 2 },
  { id: "P007", nombre: "Valentina", apellido: "Morales", dni: "40.123.456", edad: 24, sexo: "F", financiador: "Swiss Medical", plan: "SMG 50", telefono: "11-2234-5566", email: "vmorales@gmail.com", ultimaVisita: "02/03/2026", estado: "activo", turnos: 0 },
  { id: "P008", nombre: "Héctor Osvaldo", apellido: "Pereyra", dni: "12.345.678", edad: 78, sexo: "M", financiador: "PAMI", plan: "Básico", telefono: "11-4456-7788", email: null, ultimaVisita: "25/02/2026", estado: "inactivo", turnos: 0 },
  { id: "P009", nombre: "Florencia", apellido: "Castro", dni: "33.456.789", edad: 35, sexo: "F", financiador: "OSDE 210", plan: "210", telefono: "11-5578-9900", email: "fcastro@gmail.com", ultimaVisita: "08/03/2026", estado: "activo", turnos: 1 },
  { id: "P010", nombre: "Raúl Eduardo", apellido: "Sánchez", dni: "16.789.012", edad: 69, sexo: "M", financiador: "PAMI", plan: "Básico", telefono: "11-4433-2211", email: "raulsanchez@hotmail.com", ultimaVisita: "03/03/2026", estado: "activo", turnos: 4 },
  { id: "P011", nombre: "Camila", apellido: "Torres", dni: "42.567.890", edad: 21, sexo: "F", financiador: "Medifé", plan: "Bronce", telefono: "11-7789-0011", email: "ctorres@gmail.com", ultimaVisita: "09/03/2026", estado: "activo", turnos: 1 },
  { id: "P012", nombre: "Miguel Ángel", apellido: "Acosta", dni: "22.890.123", edad: 58, sexo: "M", financiador: "Sancor Salud", plan: "3000", telefono: "341-456-7890", email: "macosta@empresa.com", ultimaVisita: "07/03/2026", estado: "activo", turnos: 2 },
];

const financiadores = ["Todos", "PAMI", "OSDE 310", "OSDE 210", "Swiss Medical", "Galeno", "IOMA", "Medifé", "Sancor Salud"];

export default function PacientesPage() {
  const [search, setSearch] = useState("");
  const [filtroFinanciador, setFiltroFinanciador] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const filtered = pacientes.filter((p) => {
    const matchSearch = `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(search.toLowerCase());
    const matchFin = filtroFinanciador === "Todos" || p.financiador === filtroFinanciador;
    const matchEst = filtroEstado === "Todos" || p.estado === filtroEstado;
    return matchSearch && matchFin && matchEst;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pacientes</h1>
          <p className="text-sm text-ink-muted mt-1">{pacientes.length} pacientes registrados</p>
        </div>
        <button className="px-4 py-2.5 bg-celeste-dark text-white text-sm font-semibold rounded-[4px] hover:bg-celeste transition">
          + Nuevo paciente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-border rounded-[4px] text-sm w-72 focus:outline-none focus:border-celeste"
        />
        <select value={filtroFinanciador} onChange={(e) => setFiltroFinanciador(e.target.value)} className="px-3 py-2 border border-border rounded-[4px] text-sm text-ink-light focus:outline-none focus:border-celeste">
          {financiadores.map((f) => <option key={f}>{f}</option>)}
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="px-3 py-2 border border-border rounded-[4px] text-sm text-ink-light focus:outline-none focus:border-celeste">
          <option>Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="text-xs text-ink-muted">Total pacientes</div>
          <div className="text-2xl font-bold text-celeste-dark mt-1">{pacientes.length}</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="text-xs text-ink-muted">Activos</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{pacientes.filter(p => p.estado === "activo").length}</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="text-xs text-ink-muted">PAMI</div>
          <div className="text-2xl font-bold text-ink mt-1">{pacientes.filter(p => p.financiador === "PAMI").length}</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="text-xs text-ink-muted">Con turnos pendientes</div>
          <div className="text-2xl font-bold text-gold mt-1">{pacientes.filter(p => p.turnos > 0).length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFB] text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                <th className="text-left px-5 py-3">Paciente</th>
                <th className="text-left px-5 py-3">DNI</th>
                <th className="text-left px-5 py-3">Financiador</th>
                <th className="text-center px-5 py-3">Edad</th>
                <th className="text-left px-5 py-3">Última visita</th>
                <th className="text-center px-5 py-3">Turnos</th>
                <th className="text-center px-5 py-3">Estado</th>
                <th className="text-center px-5 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border-light hover:bg-celeste-pale/30 transition cursor-pointer">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/pacientes/${p.id}`} className="hover:text-celeste-dark">
                      <div className="font-semibold text-ink">{p.apellido}, {p.nombre}</div>
                      <div className="text-[11px] text-ink-muted">{p.email || "Sin email"}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-light font-mono text-xs">{p.dni}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                      p.financiador === "PAMI" ? "bg-celeste-pale text-celeste-dark" :
                      p.financiador.startsWith("OSDE") ? "bg-gold-pale text-[#B8860B]" :
                      "bg-[#F0F0F0] text-ink-light"
                    }`}>
                      {p.financiador}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-ink-light">{p.edad}</td>
                  <td className="px-5 py-3 text-ink-light text-xs">{p.ultimaVisita}</td>
                  <td className="px-5 py-3 text-center">
                    {p.turnos > 0 ? (
                      <span className="inline-block bg-celeste-pale text-celeste-dark text-[10px] font-bold px-2 py-0.5 rounded-full">{p.turnos}</span>
                    ) : (
                      <span className="text-ink-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${p.estado === "activo" ? "bg-green-500" : "bg-ink-muted"}`} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Link href={`/dashboard/pacientes/${p.id}`} className="text-xs text-celeste-dark hover:text-celeste font-medium">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

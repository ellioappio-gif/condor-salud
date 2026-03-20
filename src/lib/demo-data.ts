// ─── Demo Mock Data ──────────────────────────────────────────
// Centralized realistic mock data for the /demo route.
// All data is static and hardcoded — no Supabase needed.
// This powers the standalone demo experience for prospects.

// ─── Types ───────────────────────────────────────────────────

export interface DemoKPI {
  label: string;
  value: string;
  change: string;
  up: boolean;
  accent: string;
  href: string;
}

export interface DemoFactura {
  id: string;
  numero: string;
  paciente: string;
  financiador: string;
  prestacion: string;
  codigo: string;
  monto: number;
  fecha: string;
  estado: "presentada" | "cobrada" | "rechazada" | "pendiente" | "en_observacion";
}

export interface DemoRechazo {
  id: string;
  facturaNumero: string;
  paciente: string;
  financiador: string;
  motivo: string;
  monto: number;
  fecha: string;
  estado: "pendiente" | "reprocesado" | "descartado";
}

export interface DemoPaciente {
  id: string;
  nombre: string;
  dni: string;
  financiador: string;
  plan: string;
  ultimaVisita: string;
  estado: "activo" | "inactivo";
  telefono: string;
  email: string;
}

export interface DemoTurno {
  id: string;
  hora: string;
  paciente: string;
  tipo: string;
  estado: "confirmado" | "pendiente" | "cancelado";
  profesional: string;
}

export interface DemoInventario {
  id: string;
  nombre: string;
  categoria: string;
  stock: number;
  stockMin: number;
  precio: number;
  proveedor: string;
}

export interface DemoFinanciador {
  name: string;
  facturado: string;
  cobrado: string;
  rechazo: string;
  dias: string;
}

export interface DemoAudit {
  tipo: string;
  sev: "alta" | "media" | "baja";
  pac: string;
  monto: string;
}

export interface DemoAlerta {
  color: string;
  title: string;
  sub: string;
  href: string;
}

// ─── KPIs ────────────────────────────────────────────────────

export const DEMO_KPIS: DemoKPI[] = [
  {
    label: "Facturado este mes",
    value: "$4.2M",
    change: "+12% vs. mes ant.",
    up: true,
    accent: "border-l-celeste",
    href: "/demo/facturacion",
  },
  {
    label: "Cobrado",
    value: "$3.1M",
    change: "74% del facturado",
    up: true,
    accent: "border-l-green-400",
    href: "/demo/financiadores",
  },
  {
    label: "Rechazos PAMI",
    value: "8.2%",
    change: "-3.1% vs. mes ant.",
    up: false,
    accent: "border-l-amber-400",
    href: "/demo/rechazos",
  },
  {
    label: "Pérdida por inflación",
    value: "$320K",
    change: "7.6% del cobrado",
    up: false,
    accent: "border-l-red-400",
    href: "/demo",
  },
];

// ─── Facturas ────────────────────────────────────────────────

export const DEMO_FACTURAS: DemoFactura[] = [
  {
    id: "f1",
    numero: "A-0001-00012845",
    paciente: "González, María Elena",
    financiador: "PAMI",
    prestacion: "Consulta clínica",
    codigo: "420101",
    monto: 24600,
    fecha: "2026-03-15",
    estado: "presentada",
  },
  {
    id: "f2",
    numero: "A-0001-00012846",
    paciente: "López, Juan Carlos",
    financiador: "OSDE",
    prestacion: "Electrocardiograma",
    codigo: "420801",
    monto: 38200,
    fecha: "2026-03-15",
    estado: "cobrada",
  },
  {
    id: "f3",
    numero: "A-0001-00012847",
    paciente: "Ramírez, Sofía",
    financiador: "Swiss Medical",
    prestacion: "Ecografía abdominal",
    codigo: "420503",
    monto: 52000,
    fecha: "2026-03-14",
    estado: "cobrada",
  },
  {
    id: "f4",
    numero: "A-0001-00012848",
    paciente: "Díaz, Roberto",
    financiador: "IOMA",
    prestacion: "Consulta + prácticas",
    codigo: "420102",
    monto: 31800,
    fecha: "2026-03-14",
    estado: "rechazada",
  },
  {
    id: "f5",
    numero: "A-0001-00012849",
    paciente: "Morales, Ana",
    financiador: "PAMI",
    prestacion: "Laboratorio completo",
    codigo: "420601",
    monto: 45000,
    fecha: "2026-03-13",
    estado: "presentada",
  },
  {
    id: "f6",
    numero: "A-0001-00012850",
    paciente: "Castro, Pedro",
    financiador: "Galeno",
    prestacion: "Radiografía tórax",
    codigo: "420301",
    monto: 18500,
    fecha: "2026-03-13",
    estado: "pendiente",
  },
  {
    id: "f7",
    numero: "A-0001-00012851",
    paciente: "Fernández, Laura",
    financiador: "OSDE",
    prestacion: "Consulta especialista",
    codigo: "420103",
    monto: 32400,
    fecha: "2026-03-12",
    estado: "cobrada",
  },
  {
    id: "f8",
    numero: "A-0001-00012852",
    paciente: "Torres, Diego",
    financiador: "Swiss Medical",
    prestacion: "RMN rodilla",
    codigo: "420504",
    monto: 85000,
    fecha: "2026-03-12",
    estado: "en_observacion",
  },
  {
    id: "f9",
    numero: "A-0001-00012853",
    paciente: "Herrera, Claudia",
    financiador: "PAMI",
    prestacion: "Kinesiología sesión",
    codigo: "420901",
    monto: 12800,
    fecha: "2026-03-11",
    estado: "cobrada",
  },
  {
    id: "f10",
    numero: "A-0001-00012854",
    paciente: "Sánchez, Miguel",
    financiador: "IOMA",
    prestacion: "Consulta cardiología",
    codigo: "420104",
    monto: 28700,
    fecha: "2026-03-11",
    estado: "presentada",
  },
];

// ─── Rechazos ────────────────────────────────────────────────

export const DEMO_RECHAZOS: DemoRechazo[] = [
  {
    id: "r1",
    facturaNumero: "A-0001-00012720",
    paciente: "Díaz, Roberto",
    financiador: "IOMA",
    motivo: "Código inválido",
    monto: 31800,
    fecha: "2026-03-15",
    estado: "pendiente",
  },
  {
    id: "r2",
    facturaNumero: "A-0001-00012698",
    paciente: "González, María Elena",
    financiador: "PAMI",
    motivo: "Sin autorización previa",
    monto: 65000,
    fecha: "2026-03-14",
    estado: "pendiente",
  },
  {
    id: "r3",
    facturaNumero: "A-0001-00012675",
    paciente: "Morales, Ana",
    financiador: "PAMI",
    motivo: "Afiliado no encontrado",
    monto: 24600,
    fecha: "2026-03-13",
    estado: "reprocesado",
  },
  {
    id: "r4",
    facturaNumero: "A-0001-00012650",
    paciente: "Castro, Pedro",
    financiador: "Galeno",
    motivo: "Factura duplicada",
    monto: 18500,
    fecha: "2026-03-12",
    estado: "descartado",
  },
  {
    id: "r5",
    facturaNumero: "A-0001-00012632",
    paciente: "Torres, Diego",
    financiador: "Swiss Medical",
    motivo: "Datos incompletos",
    monto: 52000,
    fecha: "2026-03-11",
    estado: "pendiente",
  },
  {
    id: "r6",
    facturaNumero: "A-0001-00012610",
    paciente: "Herrera, Claudia",
    financiador: "PAMI",
    motivo: "Nomenclador desactualizado",
    monto: 12800,
    fecha: "2026-03-10",
    estado: "reprocesado",
  },
  {
    id: "r7",
    facturaNumero: "A-0001-00012598",
    paciente: "Sánchez, Miguel",
    financiador: "IOMA",
    motivo: "Factura vencida",
    monto: 28700,
    fecha: "2026-03-09",
    estado: "pendiente",
  },
];

// ─── Pacientes ───────────────────────────────────────────────

export const DEMO_PACIENTES: DemoPaciente[] = [
  {
    id: "p1",
    nombre: "González, María Elena",
    dni: "28.456.789",
    financiador: "PAMI",
    plan: "PMO",
    ultimaVisita: "2026-03-15",
    estado: "activo",
    telefono: "+54 11 4567-8901",
    email: "maria.gonzalez@email.com",
  },
  {
    id: "p2",
    nombre: "López, Juan Carlos",
    dni: "31.234.567",
    financiador: "OSDE",
    plan: "310",
    ultimaVisita: "2026-03-15",
    estado: "activo",
    telefono: "+54 11 5678-9012",
    email: "jclopez@email.com",
  },
  {
    id: "p3",
    nombre: "Ramírez, Sofía",
    dni: "35.678.901",
    financiador: "Swiss Medical",
    plan: "SMG20",
    ultimaVisita: "2026-03-14",
    estado: "activo",
    telefono: "+54 11 6789-0123",
    email: "sofia.ramirez@email.com",
  },
  {
    id: "p4",
    nombre: "Díaz, Roberto",
    dni: "25.890.123",
    financiador: "IOMA",
    plan: "Básico",
    ultimaVisita: "2026-03-14",
    estado: "activo",
    telefono: "+54 11 7890-1234",
    email: "r.diaz@email.com",
  },
  {
    id: "p5",
    nombre: "Morales, Ana",
    dni: "40.123.456",
    financiador: "PAMI",
    plan: "PMO",
    ultimaVisita: "2026-03-13",
    estado: "activo",
    telefono: "+54 11 8901-2345",
    email: "ana.morales@email.com",
  },
  {
    id: "p6",
    nombre: "Castro, Pedro",
    dni: "33.456.789",
    financiador: "Galeno",
    plan: "Oro",
    ultimaVisita: "2026-03-13",
    estado: "activo",
    telefono: "+54 11 9012-3456",
    email: "pcastro@email.com",
  },
  {
    id: "p7",
    nombre: "Fernández, Laura",
    dni: "29.789.012",
    financiador: "OSDE",
    plan: "450",
    ultimaVisita: "2026-03-12",
    estado: "activo",
    telefono: "+54 11 0123-4567",
    email: "lfernandez@email.com",
  },
  {
    id: "p8",
    nombre: "Torres, Diego",
    dni: "37.012.345",
    financiador: "Swiss Medical",
    plan: "SMG30",
    ultimaVisita: "2026-03-12",
    estado: "inactivo",
    telefono: "+54 11 1234-5678",
    email: "dtorres@email.com",
  },
];

// ─── Turnos ──────────────────────────────────────────────────

export const DEMO_TURNOS: DemoTurno[] = [
  {
    id: "t1",
    hora: "08:00",
    paciente: "González, María Elena",
    tipo: "Control",
    estado: "confirmado",
    profesional: "Dr. Martín Rodríguez",
  },
  {
    id: "t2",
    hora: "08:30",
    paciente: "López, Juan Carlos",
    tipo: "Consulta",
    estado: "confirmado",
    profesional: "Dr. Martín Rodríguez",
  },
  {
    id: "t3",
    hora: "09:00",
    paciente: "Ramírez, Sofía",
    tipo: "Primera vez",
    estado: "pendiente",
    profesional: "Dra. Carolina Vega",
  },
  {
    id: "t4",
    hora: "09:30",
    paciente: "Díaz, Roberto",
    tipo: "Ecografía",
    estado: "confirmado",
    profesional: "Dr. Martín Rodríguez",
  },
  {
    id: "t5",
    hora: "10:00",
    paciente: "Morales, Ana",
    tipo: "Laboratorio",
    estado: "confirmado",
    profesional: "Dra. Carolina Vega",
  },
  {
    id: "t6",
    hora: "10:30",
    paciente: "Castro, Pedro",
    tipo: "Radiografía",
    estado: "pendiente",
    profesional: "Dr. Martín Rodríguez",
  },
  {
    id: "t7",
    hora: "11:00",
    paciente: "Fernández, Laura",
    tipo: "Control",
    estado: "confirmado",
    profesional: "Dra. Carolina Vega",
  },
  {
    id: "t8",
    hora: "11:30",
    paciente: "Torres, Diego",
    tipo: "Consulta",
    estado: "cancelado",
    profesional: "Dr. Martín Rodríguez",
  },
];

// ─── Inventario ──────────────────────────────────────────────

export const DEMO_INVENTARIO: DemoInventario[] = [
  {
    id: "i1",
    nombre: "Guantes de látex (caja x100)",
    categoria: "Descartables",
    stock: 45,
    stockMin: 20,
    precio: 8500,
    proveedor: "MedSupply SA",
  },
  {
    id: "i2",
    nombre: "Alcohol en gel 500ml",
    categoria: "Higiene",
    stock: 8,
    stockMin: 15,
    precio: 3200,
    proveedor: "FarmaInsumos",
  },
  {
    id: "i3",
    nombre: "Jeringa descartable 5ml (x100)",
    categoria: "Descartables",
    stock: 32,
    stockMin: 10,
    precio: 12000,
    proveedor: "MedSupply SA",
  },
  {
    id: "i4",
    nombre: "Gasas estériles 10x10",
    categoria: "Curaciones",
    stock: 120,
    stockMin: 50,
    precio: 4500,
    proveedor: "FarmaInsumos",
  },
  {
    id: "i5",
    nombre: "Barbijo tricapa (x50)",
    categoria: "Descartables",
    stock: 3,
    stockMin: 10,
    precio: 6800,
    proveedor: "MedSupply SA",
  },
  {
    id: "i6",
    nombre: "Solución fisiológica 500ml",
    categoria: "Soluciones",
    stock: 60,
    stockMin: 30,
    precio: 2800,
    proveedor: "Laboratorios Norte",
  },
  {
    id: "i7",
    nombre: "Cinta adhesiva micropore",
    categoria: "Curaciones",
    stock: 25,
    stockMin: 10,
    precio: 1900,
    proveedor: "FarmaInsumos",
  },
  {
    id: "i8",
    nombre: "Termómetro digital",
    categoria: "Equipamiento",
    stock: 12,
    stockMin: 5,
    precio: 15000,
    proveedor: "MedTech Argentina",
  },
];

// ─── Financiadores ───────────────────────────────────────────

export const DEMO_FINANCIADORES: DemoFinanciador[] = [
  { name: "PAMI", facturado: "$1.4M", cobrado: "$980K", rechazo: "12%", dias: "68" },
  { name: "OSDE", facturado: "$890K", cobrado: "$845K", rechazo: "4%", dias: "32" },
  { name: "Swiss Medical", facturado: "$620K", cobrado: "$595K", rechazo: "2%", dias: "28" },
  { name: "IOMA", facturado: "$410K", cobrado: "$312K", rechazo: "18%", dias: "82" },
  { name: "Galeno", facturado: "$280K", cobrado: "$268K", rechazo: "3%", dias: "35" },
  { name: "Medifé", facturado: "$195K", cobrado: "$178K", rechazo: "6%", dias: "42" },
];

// ─── Auditoria ───────────────────────────────────────────────

export const DEMO_AUDIT: DemoAudit[] = [
  { tipo: "Código incorrecto", sev: "alta", pac: "González — PAMI", monto: "$24.600" },
  { tipo: "Autorización vencida", sev: "alta", pac: "Ramírez — Swiss Med.", monto: "$65.000" },
  { tipo: "Duplicado potencial", sev: "media", pac: "Morales — Galeno", monto: "$32.000" },
  { tipo: "Tope superado", sev: "alta", pac: "Romero — Medifé", monto: "$42.300" },
];

// ─── Alertas ─────────────────────────────────────────────────

export const DEMO_ALERTAS: DemoAlerta[] = [
  {
    href: "/demo/rechazos",
    color: "border-amber-400",
    title: "5 rechazos IOMA nuevos",
    sub: "Hace 2 horas · Error de código",
  },
  {
    href: "/demo/facturacion",
    color: "border-celeste",
    title: "Vence presentación PAMI",
    sub: "En 3 días · 12 facturas pendientes",
  },
  {
    href: "/demo",
    color: "border-amber-400",
    title: "Nomenclador SSS actualizado",
    sub: "Ayer · 14 códigos modificados",
  },
  {
    href: "/demo/financiadores",
    color: "border-celeste",
    title: "Swiss Medical pagó lote",
    sub: "Hoy · $595K acreditados",
  },
];

// ─── Chart data ──────────────────────────────────────────────

export const DEMO_CHART_BARS = [40, 55, 48, 62, 58, 72];

// ─── Quick access items ──────────────────────────────────────

export const DEMO_QUICK_LINKS = [
  { label: "Pacientes", desc: "8 activos", href: "/demo/pacientes" },
  { label: "Agenda", desc: "8 turnos hoy", href: "/demo" },
  { label: "Facturación", desc: "10 facturas", href: "/demo/facturacion" },
  { label: "Inventario", desc: "2 críticos", href: "/demo/inventario" },
  { label: "Rechazos", desc: "4 pendientes", href: "/demo/rechazos" },
  { label: "Financiadores", desc: "6 activos", href: "/demo/financiadores" },
];

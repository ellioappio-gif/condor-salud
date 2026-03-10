// ─── Domain Types ────────────────────────────────────────────
// Shared TypeScript types for Cóndor Salud.
// See BRANDKIT.md §10 for terminology reference.

export type PlanTier = "starter" | "growth" | "scale" | "enterprise";
export type FinanciadorType = "os" | "prepaga" | "pami";
export type FacturaEstado = "presentada" | "cobrada" | "rechazada" | "pendiente" | "en_observacion";
export type RechazoMotivo =
  | "codigo_invalido"
  | "afiliado_no_encontrado"
  | "vencida"
  | "duplicada"
  | "sin_autorizacion"
  | "datos_incompletos"
  | "nomenclador_desactualizado";

// ─── Entities ────────────────────────────────────────────────

export interface Clinic {
  id: string;
  name: string;
  cuit: string;
  planTier: PlanTier;
  sedes: number;
  provincia: string;
  localidad: string;
}

export interface Financiador {
  id: string;
  name: string;
  type: FinanciadorType;
  facturado: number;
  cobrado: number;
  tasaRechazo: number;
  diasPromedioPago: number;
  facturasPendientes: number;
  ultimoPago?: string;
}

export interface Factura {
  id: string;
  numero: string;
  fecha: string;
  financiador: string;
  paciente: string;
  prestacion: string;
  codigoNomenclador: string;
  monto: number;
  estado: FacturaEstado;
  fechaPresentacion?: string;
  fechaCobro?: string;
  cae?: string;
}

export interface Rechazo {
  id: string;
  facturaId: string;
  facturaNumero: string;
  financiador: string;
  paciente: string;
  prestacion: string;
  monto: number;
  motivo: RechazoMotivo;
  motivoDetalle: string;
  fechaRechazo: string;
  fechaPresentacion: string;
  reprocesable: boolean;
  estado: "pendiente" | "reprocesado" | "descartado";
}

export interface VerificacionResult {
  status: "activo" | "inactivo";
  nombre: string;
  financiador: string;
  plan: string;
  vigencia: string;
  grupo: string;
}

export interface InflacionMes {
  mes: string;
  ipc: number;
  facturado: number;
  cobrado: number;
  diasDemora: number;
  perdidaReal: number;
  perdidaPorcentaje: number;
}

export interface Alerta {
  id: string;
  tipo: "rechazo" | "vencimiento" | "nomenclador" | "pago" | "inflacion";
  titulo: string;
  detalle: string;
  fecha: string;
  acento: "celeste" | "gold";
}

export interface KPI {
  label: string;
  value: string;
  change: string;
  up: boolean;
  color: string;
}

// ─── Module 11: Farmacia ─────────────────────────────────────

export interface Medication {
  id: string;
  name: string;
  lab: string;
  category: string;
  price: number;
  pamiCoverage: number;
  osCoverage: number;
  prepagaCoverage: number;
  stock: "Disponible" | "Últimas unidades" | "Sin stock";
  requiresPrescription: boolean;
}

export interface Prescription {
  id: string;
  code: string;
  patientName: string;
  doctorName: string;
  date: string;
  items: string[];
  status: "Pendiente" | "En carrito" | "Entregado" | "Cancelado";
  financiador: string;
}

export interface Delivery {
  id: string;
  code: string;
  patientName: string;
  address: string;
  itemCount: number;
  status: "Preparando" | "En camino" | "Entregado" | "Cancelado";
  eta: string;
  courier: string;
  progress: number;
}

export interface RecurringOrder {
  id: string;
  code: string;
  patientName: string;
  medications: string[];
  frequency: string;
  nextDelivery: string;
  financiador: string;
  status: "Activo" | "Pausado" | "Cancelado";
}

// ─── Module 12: Telemedicina ─────────────────────────────────

export interface WaitingRoomEntry {
  id: string;
  patientName: string;
  age: number;
  reason: string;
  queuePosition: number;
  waitTime: string;
  intakeComplete: boolean;
  financiador: string;
  joinedAt: string;
}

export interface Consultation {
  id: string;
  code: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  duration: string;
  status: "Programada" | "En sala" | "En curso" | "Completada" | "No show" | "Cancelada";
  billed: boolean;
  billCode: string | null;
  prescriptionSent: boolean;
  summarySent: boolean;
  financiador: string;
  videoRoomUrl?: string;
}

// ─── Module 13: Directorio Médico ────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  address: string;
  financiadores: string[];
  rating: number;
  reviews: number;
  nextSlot: string;
  available: boolean;
  teleconsulta: boolean;
  experience: string;
  languages: string[];
}

export interface DoctorReview {
  id: string;
  doctorId: string;
  patientName: string;
  rating: number;
  text: string;
  date: string;
}

// ─── Module 14: Triage ───────────────────────────────────────

export interface Triage {
  id: string;
  code: string;
  patientName: string;
  date: string;
  symptoms: string[];
  severity: number;
  frequency: string;
  duration: string;
  triggers: string;
  freeNotes: string;
  photoUrls: string[];
  routedSpecialty: string;
  routedDoctor: string;
  status: "Pendiente" | "En consulta" | "Completado" | "Cancelado";
}

export interface ClinicalNote {
  id: string;
  triageId?: string;
  consultationId?: string;
  doctorName: string;
  patientName: string;
  icd10Codes: { code: string; description: string }[];
  notes: string;
  treatmentPlan: string;
  referrals: string[];
  date: string;
}

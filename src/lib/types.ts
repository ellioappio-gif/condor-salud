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

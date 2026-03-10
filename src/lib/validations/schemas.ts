import { z } from "zod";

// ─── Paciente schema ─────────────────────────────────────────
export const pacienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").min(2, "Mínimo 2 caracteres"),
  apellido: z.string().min(1, "El apellido es requerido").min(2, "Mínimo 2 caracteres"),
  dni: z
    .string()
    .min(1, "El DNI es requerido")
    .regex(/^\d{7,8}$/, "DNI inválido (7-8 dígitos)"),
  fechaNacimiento: z.string().min(1, "La fecha de nacimiento es requerida"),
  sexo: z.enum(["M", "F", "X"], { error: "Seleccioná el sexo" }),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  financiador: z.string().min(1, "Seleccioná un financiador"),
  numeroAfiliado: z.string().min(1, "El número de afiliado es requerido"),
  plan: z.string().optional(),
  direccion: z.string().optional(),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
});

export type PacienteInput = z.infer<typeof pacienteSchema>;

// ─── Factura schema ──────────────────────────────────────────
export const facturaSchema = z.object({
  pacienteId: z.string().min(1, "Seleccioná un paciente"),
  financiador: z.string().min(1, "Seleccioná un financiador"),
  prestacion: z.string().min(1, "Ingresá la prestación"),
  codigoNomenclador: z.string().min(1, "Ingresá el código"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.string().min(1, "La fecha es requerida"),
});

export type FacturaInput = z.infer<typeof facturaSchema>;

// ─── Turno (agenda) schema ───────────────────────────────────
export const turnoSchema = z.object({
  pacienteId: z.string().min(1, "Seleccioná un paciente"),
  profesional: z.string().min(1, "Seleccioná un profesional"),
  fecha: z.string().min(1, "La fecha es requerida"),
  hora: z.string().min(1, "La hora es requerida"),
  duracion: z.number().min(15, "Mínimo 15 minutos").max(240, "Máximo 4 horas"),
  tipo: z.enum(["consulta", "control", "estudio", "cirugia", "otro"]),
  notas: z.string().optional(),
});

export type TurnoInput = z.infer<typeof turnoSchema>;

// ─── Inventario schema ───────────────────────────────────────
export const inventarioItemSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  categoria: z.string().min(1, "Seleccioná una categoría"),
  stockActual: z.number().int().min(0, "Stock no puede ser negativo"),
  stockMinimo: z.number().int().min(0),
  unidad: z.string().min(1, "Seleccioná la unidad"),
  precioUnitario: z.number().min(0, "Precio no puede ser negativo"),
  proveedor: z.string().optional(),
  lote: z.string().optional(),
  vencimiento: z.string().optional(),
});

export type InventarioItemInput = z.infer<typeof inventarioItemSchema>;

// ─── Verificación schema ─────────────────────────────────────
export const verificacionSchema = z.object({
  dni: z
    .string()
    .min(1, "El DNI es requerido")
    .regex(/^\d{7,8}$/, "DNI inválido"),
  financiador: z.string().min(1, "Seleccioná el financiador"),
});

export type VerificacionInput = z.infer<typeof verificacionSchema>;

// ─── Search schema ───────────────────────────────────────────
export const searchSchema = z.object({
  query: z.string().min(1, "Ingresá un término de búsqueda"),
});

// ─── Config schemas ──────────────────────────────────────────
export const clinicConfigSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  cuit: z.string().regex(/^\d{2}-?\d{8}-?\d{1}$/, "CUIT inválido"),
  direccion: z.string().min(1, "La dirección es requerida"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Email inválido"),
  provincia: z.string().min(1, "Seleccioná una provincia"),
  localidad: z.string().min(1, "La localidad es requerida"),
});

export type ClinicConfigInput = z.infer<typeof clinicConfigSchema>;

export const teamMemberSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "medico", "facturacion", "recepcion"]),
  especialidad: z.string().optional(),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

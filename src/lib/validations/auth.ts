import { z } from "zod";

// ─── Login schema ────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, "El email es requerido").email("Ingresá un email válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Registration schema ─────────────────────────────────────
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre es requerido")
      .min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().min(1, "El email es requerido").email("Ingresá un email válido"),
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(12, "La contraseña debe tener al menos 12 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial (!@#$%...)"),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
    clinicName: z.string().min(1, "El nombre de la clínica es requerido"),
    cuit: z
      .string()
      .min(1, "El CUIT es requerido")
      .regex(/^\d{2}-?\d{8}-?\d{1}$/, "CUIT inválido (XX-XXXXXXXX-X)"),
    provincia: z.string().min(1, "Seleccioná una provincia"),
    especialidad: z.string().min(1, "Seleccioná una especialidad"),
    financiadores: z.array(z.string()).min(1, "Seleccioná al menos un financiador"),
    terms: z.literal(true, {
      error: "Debés aceptar los términos y condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

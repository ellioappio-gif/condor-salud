import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("validates correct login data", () => {
    const result = loginSchema.safeParse({
      email: "doctor@clinica.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "doctor@clinica.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validData = {
    name: "Dr. Martín Rodríguez",
    email: "martin@clinica.com",
    password: "Password1!Secure",
    confirmPassword: "Password1!Secure",
    clinicName: "Clínica San Martín",
    cuit: "20-34567890-1",
    provincia: "Buenos Aires",
    especialidad: "Cardiología",
    financiadores: ["PAMI", "OSDE"],
    terms: true as const,
  };

  it("validates correct registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: "DifferentPass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "password1!test",
      confirmPassword: "password1!test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "PasswordOnly!x",
      confirmPassword: "PasswordOnly!x",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty financiadores", () => {
    const result = registerSchema.safeParse({
      ...validData,
      financiadores: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects without terms acceptance", () => {
    const result = registerSchema.safeParse({
      ...validData,
      terms: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid CUIT format", () => {
    const result = registerSchema.safeParse({
      ...validData,
      cuit: "12345",
    });
    expect(result.success).toBe(false);
  });
});

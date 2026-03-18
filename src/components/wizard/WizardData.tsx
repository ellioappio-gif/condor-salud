"use client";

import { useState, useCallback, createContext, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { UploadedFile } from "@/components/ui/FileUpload";
import {
  Feather,
  Building2,
  Users,
  FileSpreadsheet,
  Settings,
  CheckCircle2,
  Home,
  HeartPulse,
  Cog,
} from "lucide-react";

// ─── Icon maps ───────────────────────────────────────────────

export const WIZARD_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  bienvenida: Feather,
  clinica: Building2,
  equipo: Users,
  importacion: FileSpreadsheet,
  configuracion: Settings,
  confirmacion: CheckCircle2,
};

export const WIZARD_CATEGORY_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Inicio: Home,
  "Datos de la clínica": HeartPulse,
  Configuración: Cog,
};

// ─── Step Data Model ─────────────────────────────────────────

export interface SetupStep {
  id: string;
  category: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  /** Which formData keys this step requires (for validation) */
  requiredFields?: string[];
}

// ─── All Steps ───────────────────────────────────────────────

export const WIZARD_STEPS: SetupStep[] = [
  {
    id: "bienvenida",
    category: "Inicio",
    icon: "bienvenida",
    title: "Bienvenido a Cóndor Salud",
    subtitle: "Configurá tu clínica en minutos",
    description:
      "Este asistente te guía paso a paso para dejar tu clínica lista. Podés completar todo ahora o guardar el progreso y continuar después. Toda la información se puede modificar más adelante desde Configuración.",
  },
  {
    id: "clinica",
    category: "Datos de la clínica",
    icon: "clinica",
    title: "Datos de la clínica",
    subtitle: "Información básica de tu centro",
    description:
      "Completá los datos básicos de tu clínica. Esta información se usa en facturas, reportes y comunicaciones con pacientes.",
    requiredFields: ["nombre"],
  },
  {
    id: "equipo",
    category: "Datos de la clínica",
    icon: "equipo",
    title: "Equipo médico",
    subtitle: "Profesionales y roles",
    description:
      "Agregá los miembros de tu equipo manualmente o importá una planilla. Cada miembro recibe un rol con permisos específicos (admin, médico, facturación, recepción).",
  },
  {
    id: "importacion",
    category: "Datos de la clínica",
    icon: "importacion",
    title: "Importar datos",
    subtitle: "Pacientes, turnos y documentos",
    description:
      "Subí planillas con datos de pacientes, historial de turnos o cualquier documento que necesites migrar. Aceptamos Excel (.xlsx), CSV y PDF.",
  },
  {
    id: "configuracion",
    category: "Configuración",
    icon: "configuracion",
    title: "Configuración inicial",
    subtitle: "Financiadores, especialidades y más",
    description:
      "Seleccioná las obras sociales y prepagas con las que trabajás, las especialidades de tu clínica y las preferencias generales.",
  },
  {
    id: "confirmacion",
    category: "Configuración",
    icon: "confirmacion",
    title: "¡Todo listo!",
    subtitle: "Revisá y confirmá",
    description:
      "Revisá un resumen de toda la información cargada. Al confirmar, tu clínica queda activa y lista para operar.",
  },
];

// ─── Category grouping ──────────────────────────────────────

export const WIZARD_CATEGORIES = [
  { name: "Inicio", icon: "Inicio", stepIds: ["bienvenida"] },
  {
    name: "Datos de la clínica",
    icon: "Datos de la clínica",
    stepIds: ["clinica", "equipo", "importacion"],
  },
  { name: "Configuración", icon: "Configuración", stepIds: ["configuracion", "confirmacion"] },
];

// ─── Form Data ───────────────────────────────────────────────

export interface OnboardingFormData {
  // Step 2: Clinic info
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  cuit: string;
  logoFiles: UploadedFile[];

  // Step 3: Team
  cantidadProfesionales: number;
  teamFiles: UploadedFile[];
  teamMembers: TeamMember[];

  // Step 4: Import
  patientFiles: UploadedFile[];
  documentFiles: UploadedFile[];

  // Step 5: Config
  especialidades: string[];
  financiadores: string[];
  sistemaAnterior: string;
  enableWhatsapp: boolean;
  enableTelemedicina: boolean;
}

export interface TeamMember {
  name: string;
  email: string;
  role: "admin" | "medico" | "facturacion" | "recepcion";
  specialty?: string;
}

const DEFAULT_FORM: OnboardingFormData = {
  nombre: "",
  direccion: "",
  telefono: "",
  email: "",
  cuit: "",
  logoFiles: [],
  cantidadProfesionales: 1,
  teamFiles: [],
  teamMembers: [],
  patientFiles: [],
  documentFiles: [],
  especialidades: [],
  financiadores: [],
  sistemaAnterior: "",
  enableWhatsapp: false,
  enableTelemedicina: false,
};

// ─── Available options ───────────────────────────────────────

export const ESPECIALIDADES_OPTIONS = [
  "Cardiología",
  "Clínica médica",
  "Dermatología",
  "Endocrinología",
  "Gastroenterología",
  "Ginecología",
  "Neurología",
  "Oftalmología",
  "Pediatría",
  "Traumatología",
  "Urología",
  "Cirugía general",
  "Kinesiología",
  "Nutrición",
  "Psicología",
  "Psiquiatría",
];

export const FINANCIADORES_OPTIONS = [
  "PAMI",
  "OSDE",
  "Swiss Medical",
  "IOMA",
  "Galeno",
  "Medifé",
  "Sancor Salud",
  "Unión Personal",
  "OSECAC",
  "OSPIP",
  "Particular",
];

export const SISTEMA_ANTERIOR_OPTIONS = [
  "Ninguno (empiezo de cero)",
  "Planillas Excel",
  "Software propio",
  "Otro sistema de gestión",
  "Historia clínica en papel",
];

// ─── Context ─────────────────────────────────────────────────

interface WizardContextType {
  currentStep: number;
  totalSteps: number;
  step: SetupStep;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  canNext: boolean;
  canPrev: boolean;
  progress: number;
  completedSteps: Set<number>;
  markComplete: (index: number) => void;
  formData: OnboardingFormData;
  updateForm: (patch: Partial<OnboardingFormData>) => void;
  completeSetup: () => Promise<void>;
  isSubmitting: boolean;
  setupError: string | null;
  validationError: string | null;
  validateCurrentStep: () => boolean;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<OnboardingFormData>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const router = useRouter();

  const totalSteps = WIZARD_STEPS.length;
  const step = WIZARD_STEPS[currentStep] ?? WIZARD_STEPS[0]!;
  const canNext = currentStep < totalSteps - 1;
  const canPrev = currentStep > 0;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const updateForm = useCallback((patch: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setValidationError(null);
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    const s = WIZARD_STEPS[currentStep];
    if (!s?.requiredFields?.length) return true;

    for (const field of s.requiredFields) {
      const val = formData[field as keyof OnboardingFormData];
      if (!val || (typeof val === "string" && !val.trim())) {
        const labels: Record<string, string> = {
          nombre: "nombre de la clínica",
        };
        setValidationError(`Completá el campo "${labels[field] || field}" para continuar.`);
        return false;
      }
    }
    setValidationError(null);
    return true;
  }, [currentStep, formData]);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSteps) {
        if (index > currentStep && !validateCurrentStep()) return;
        setCompletedSteps((prev) => {
          const next = new Set(Array.from(prev));
          next.add(currentStep);
          return next;
        });
        setCurrentStep(index);
      }
    },
    [currentStep, totalSteps, validateCurrentStep],
  );

  const next = useCallback(() => {
    if (!canNext) return;
    if (!validateCurrentStep()) return;

    setCompletedSteps((prev) => {
      const n = new Set(Array.from(prev));
      n.add(currentStep);
      return n;
    });
    setCurrentStep((s) => s + 1);

    // Save progress (non-blocking)
    import("@/lib/services/onboarding").then(({ saveOnboardingProgress }) =>
      saveOnboardingProgress(currentStep + 1).catch(() => {}),
    );
  }, [canNext, currentStep, validateCurrentStep]);

  const prev = useCallback(() => {
    if (canPrev) {
      setValidationError(null);
      setCurrentStep((s) => s - 1);
    }
  }, [canPrev]);

  const markComplete = useCallback((index: number) => {
    setCompletedSteps((prev) => {
      const n = new Set(Array.from(prev));
      n.add(index);
      return n;
    });
  }, []);

  const completeSetup = useCallback(async () => {
    setIsSubmitting(true);
    setSetupError(null);
    try {
      const { completeOnboarding } = await import("@/lib/services/onboarding");
      const result = await completeOnboarding({
        nombre: formData.nombre,
        direccion: formData.direccion || undefined,
        telefono: formData.telefono || undefined,
        email: formData.email || undefined,
        especialidades: formData.especialidades.length ? formData.especialidades : undefined,
        cantidadProfesionales: formData.cantidadProfesionales,
        sistemaAnterior: formData.sistemaAnterior || undefined,
      });

      if (!result.success) {
        setSetupError(result.error ?? "Error al completar el onboarding");
        return;
      }

      setCompletedSteps(new Set(Array.from({ length: totalSteps }, (_, i) => i)));
      router.push("/dashboard");
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, totalSteps, router]);

  const value = useMemo(
    () => ({
      currentStep,
      totalSteps,
      step,
      goTo,
      next,
      prev,
      canNext,
      canPrev,
      progress,
      completedSteps,
      markComplete,
      formData,
      updateForm,
      completeSetup,
      isSubmitting,
      setupError,
      validationError,
      validateCurrentStep,
    }),
    [
      currentStep,
      totalSteps,
      step,
      goTo,
      next,
      prev,
      canNext,
      canPrev,
      progress,
      completedSteps,
      markComplete,
      formData,
      updateForm,
      completeSetup,
      isSubmitting,
      setupError,
      validationError,
      validateCurrentStep,
    ],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

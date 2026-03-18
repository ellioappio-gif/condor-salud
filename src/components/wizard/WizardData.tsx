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
      "Este asistente te guía paso a paso para dejar tu clínica operativa. Vas a poder: cargar datos básicos, importar pacientes desde planillas, configurar WhatsApp AI para turnos automáticos y recordatorios 24 hs, y activar recetas digitales por WhatsApp. Solo el nombre de la clínica es obligatorio — todo lo demás se puede completar después.",
  },
  {
    id: "clinica",
    category: "Datos de la clínica",
    icon: "clinica",
    title: "Datos de la clínica",
    subtitle: "Información básica de tu centro",
    description:
      "Esta información aparece en facturas, reportes PDF, y comunicaciones con pacientes. El logo se muestra en el dashboard y en las recetas digitales que envía el sistema por WhatsApp. Podés subir fotos desde la cámara del celular.",
    requiredFields: ["nombre"],
  },
  {
    id: "equipo",
    category: "Datos de la clínica",
    icon: "equipo",
    title: "Equipo médico",
    subtitle: "Profesionales y roles",
    description:
      "Cada miembro recibe un rol con permisos específicos: admin (acceso total), médico (historia clínica + agenda), facturación (cobros + reportes), recepción (turnos + pacientes). Podés agregar uno por uno o importar todo tu equipo desde una planilla Excel/CSV.",
  },
  {
    id: "importacion",
    category: "Datos de la clínica",
    icon: "importacion",
    title: "Importar datos",
    subtitle: "Pacientes, turnos y documentos",
    description:
      "Subí planillas con datos de pacientes para migrar desde tu sistema anterior. También podés subir contratos, habilitaciones, o documentos escaneados (usá la cámara del celular para fotos). Aceptamos Excel (.xlsx), CSV y PDF.",
  },
  {
    id: "configuracion",
    category: "Configuración",
    icon: "configuracion",
    title: "Configuración inicial",
    subtitle: "WhatsApp AI, financiadores y más",
    description:
      "Configurá el número de WhatsApp de tu clínica para activar el bot con IA: agenda turnos automáticamente, pregunta síntomas y gravedad, envía recordatorios 24 hs antes, y manda recetas digitales por WhatsApp. También elegí las obras sociales y especialidades con las que trabajás.",
  },
  {
    id: "confirmacion",
    category: "Configuración",
    icon: "confirmacion",
    title: "¡Todo listo!",
    subtitle: "Revisá y confirmá",
    description:
      "Revisá un resumen de toda la información cargada. Al confirmar, tu clínica queda activa con: dashboard en tiempo real, agenda inteligente, facturación automática, auditoría de cobros, WhatsApp AI, telemedicina, y más.",
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
  /** Clinic WhatsApp number in E.164 format */
  whatsappNumber: string;
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
  whatsappNumber: "",
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
        whatsappNumber: formData.whatsappNumber || undefined,
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

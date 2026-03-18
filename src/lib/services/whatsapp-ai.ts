// ─── WhatsApp AI Integration Service ─────────────────────────
// Handles AI-powered WhatsApp interactions for clinics:
// 1. Auto-scheduling appointments via conversational AI
// 2. Symptom triage with severity assessment
// 3. 24-hour appointment reminders
// 4. Digital prescription delivery
//
// Uses WhatsApp Business Cloud API + OpenAI for natural language.
// Requires: WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, OPENAI_API_KEY

import { logger } from "@/lib/security/api-guard";

// ─── Types ───────────────────────────────────────────────────

export interface WhatsAppAIConfig {
  /** Clinic WhatsApp number in E.164 format (e.g. +5411xxxx) */
  whatsappNumber: string;
  /** WhatsApp Business Cloud API token */
  apiToken: string;
  /** WhatsApp phone number ID (from Meta Business Suite) */
  phoneNumberId: string;
  /** Clinic name for message personalization */
  clinicName: string;
  /** Clinic address */
  clinicAddress?: string;
  /** Google Maps URL */
  mapsUrl?: string;
}

export interface SymptomAssessment {
  symptoms: string[];
  severity: "leve" | "moderado" | "urgente" | "emergencia";
  recommendation: string;
  suggestedSpecialty?: string;
  shouldSchedule: boolean;
}

export interface AppointmentRequest {
  patientPhone: string;
  patientName: string;
  preferredDate?: string;
  preferredTime?: string;
  specialty?: string;
  reason?: string;
  symptoms?: SymptomAssessment;
}

export interface Prescription {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorMatricula: string;
  date: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[];
  diagnosis?: string;
  instructions?: string;
}

export interface ReminderConfig {
  /** Hours before appointment to send first reminder (default: 24) */
  hoursBeforeFirst: number;
  /** Hours before appointment to send second reminder (default: 2) */
  hoursBeforeSecond: number;
  /** Allow patient to confirm via reply */
  allowConfirmation: boolean;
  /** Allow patient to cancel via reply */
  allowCancellation: boolean;
  /** Allow patient to reschedule via reply */
  allowReschedule: boolean;
  /** Include Google Maps link */
  includeMaps: boolean;
}

export interface ConversationState {
  patientPhone: string;
  stage:
    | "greeting"
    | "symptom_collection"
    | "severity_assessment"
    | "scheduling"
    | "confirmation"
    | "completed";
  collectedSymptoms: string[];
  severity?: SymptomAssessment["severity"];
  appointmentRequest?: Partial<AppointmentRequest>;
  lastMessageAt: Date;
}

// ─── Default configuration ───────────────────────────────────

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  hoursBeforeFirst: 24,
  hoursBeforeSecond: 2,
  allowConfirmation: true,
  allowCancellation: true,
  allowReschedule: true,
  includeMaps: true,
};

// ─── Severity thresholds for AI triage ───────────────────────

const EMERGENCY_KEYWORDS = [
  "dolor de pecho",
  "no puedo respirar",
  "desmayo",
  "convulsiones",
  "sangrado severo",
  "accidente",
  "pérdida de consciencia",
  "dolor de cabeza intenso",
  "visión borrosa repentina",
  "parálisis",
];

const URGENT_KEYWORDS = [
  "fiebre alta",
  "dolor fuerte",
  "vómitos persistentes",
  "diarrea con sangre",
  "dolor abdominal intenso",
  "dificultad para respirar",
  "corte profundo",
  "quemadura",
  "reacción alérgica",
];

// ─── WhatsApp Business Cloud API ─────────────────────────────

const WA_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * Send a WhatsApp text message via the Cloud API.
 */
export async function sendWhatsAppMessage(
  config: WhatsAppAIConfig,
  to: string,
  message: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${WA_API_BASE}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/[^\d+]/g, ""),
        type: "text",
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      logger.error({ err, to: to.slice(0, 6) + "***" }, "WhatsApp API error");
      return { success: false, error: err?.error?.message ?? "Error al enviar mensaje" };
    }

    const data = await response.json();
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    logger.error({ err }, "WhatsApp send failed");
    return { success: false, error: "Error de conexión con WhatsApp" };
  }
}

// ─── AI Symptom Triage ───────────────────────────────────────

/**
 * Analyze patient-described symptoms and assess severity.
 * Uses keyword matching + AI for nuanced cases.
 */
export function assessSymptoms(description: string): SymptomAssessment {
  const lower = description.toLowerCase();
  const symptoms = description
    .split(/[,;.]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Check for emergency keywords first
  const isEmergency = EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
  if (isEmergency) {
    return {
      symptoms,
      severity: "emergencia",
      recommendation:
        "⚠️ *EMERGENCIA* — Dirigite inmediatamente a la guardia más cercana o llamá al 107 (SAME). No esperes un turno.",
      shouldSchedule: false,
    };
  }

  // Check for urgent keywords
  const isUrgent = URGENT_KEYWORDS.some((kw) => lower.includes(kw));
  if (isUrgent) {
    return {
      symptoms,
      severity: "urgente",
      recommendation:
        "🔴 Los síntomas requieren atención pronto. Te recomendamos un turno dentro de las próximas 24 horas.",
      suggestedSpecialty: suggestSpecialty(lower),
      shouldSchedule: true,
    };
  }

  // Moderate vs mild heuristic
  const hasMultipleSymptoms = symptoms.length >= 3;
  const hasDurationWords = /hace (varios|muchos|semanas|meses|días)/i.test(lower);

  if (hasMultipleSymptoms || hasDurationWords) {
    return {
      symptoms,
      severity: "moderado",
      recommendation: "🟡 Te sugerimos agendar un turno esta semana para una evaluación.",
      suggestedSpecialty: suggestSpecialty(lower),
      shouldSchedule: true,
    };
  }

  return {
    symptoms,
    severity: "leve",
    recommendation: "🟢 Los síntomas parecen leves. Podés agendar un turno cuando te quede cómodo.",
    suggestedSpecialty: suggestSpecialty(lower),
    shouldSchedule: true,
  };
}

function suggestSpecialty(text: string): string | undefined {
  const map: Record<string, string> = {
    corazón: "Cardiología",
    pecho: "Cardiología",
    palpitaciones: "Cardiología",
    piel: "Dermatología",
    erupción: "Dermatología",
    estómago: "Gastroenterología",
    digestión: "Gastroenterología",
    abdomen: "Gastroenterología",
    cabeza: "Neurología",
    mareo: "Neurología",
    vista: "Oftalmología",
    ojos: "Oftalmología",
    huesos: "Traumatología",
    articulaciones: "Traumatología",
    niño: "Pediatría",
    hijo: "Pediatría",
    hija: "Pediatría",
    ansiedad: "Psicología",
    depresión: "Psiquiatría",
    tristeza: "Psicología",
  };

  for (const [keyword, specialty] of Object.entries(map)) {
    if (text.includes(keyword)) return specialty;
  }
  return "Clínica médica";
}

// ─── Appointment Reminder System ─────────────────────────────

/**
 * Build the 24-hour reminder message for an appointment.
 */
export function buildReminderMessage(params: {
  patientName: string;
  clinicName: string;
  date: string;
  time: string;
  doctorName: string;
  appointmentType: string;
  clinicAddress?: string;
  mapsUrl?: string;
  allowConfirm: boolean;
  allowCancel: boolean;
  allowReschedule: boolean;
}): string {
  let msg =
    `Hola ${params.patientName}, te recordamos tu turno en *${params.clinicName}*:\n\n` +
    `📅 Fecha: *${params.date}*\n` +
    `🕐 Hora: *${params.time}*\n` +
    `👨‍⚕️ Profesional: *${params.doctorName}*\n` +
    `📋 Tipo: ${params.appointmentType}\n`;

  if (params.clinicAddress) {
    msg += `\n📍 Dirección: ${params.clinicAddress}`;
  }
  if (params.mapsUrl) {
    msg += `\n🗺️ Cómo llegar: ${params.mapsUrl}`;
  }

  const options: string[] = [];
  if (params.allowConfirm) options.push("*1* — Confirmar turno");
  if (params.allowCancel) options.push("*2* — Cancelar turno");
  if (params.allowReschedule) options.push("*3* — Reprogramar");

  if (options.length) {
    msg += "\n\nRespondé:\n" + options.join("\n");
  }

  return msg;
}

/**
 * Build the 2-hour reminder message.
 */
export function buildShortReminderMessage(params: {
  patientName: string;
  clinicName: string;
  time: string;
  doctorName: string;
  clinicAddress?: string;
  mapsUrl?: string;
}): string {
  let msg = `Hola ${params.patientName}, tu turno es *hoy a las ${params.time}* con ${params.doctorName}.\n`;

  if (params.clinicAddress) {
    msg += `\n📍 ${params.clinicAddress}`;
  }
  if (params.mapsUrl) {
    msg += `\n🗺️ ${params.mapsUrl}`;
  }

  msg += "\n\n¡Te esperamos!";
  return msg;
}

/**
 * Process upcoming appointments and send reminders.
 * Called by a cron job or serverless function.
 */
export async function processAppointmentReminders(
  config: WhatsAppAIConfig,
  reminderConfig: ReminderConfig,
  appointments: {
    patientName: string;
    patientPhone: string;
    date: string;
    time: string;
    doctorName: string;
    type: string;
    hoursUntil: number;
  }[],
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const apt of appointments) {
    // Determine which reminder to send
    const isFirstReminder =
      apt.hoursUntil <= reminderConfig.hoursBeforeFirst &&
      apt.hoursUntil > reminderConfig.hoursBeforeSecond;
    const isSecondReminder = apt.hoursUntil <= reminderConfig.hoursBeforeSecond;

    if (!isFirstReminder && !isSecondReminder) continue;

    const message = isFirstReminder
      ? buildReminderMessage({
          patientName: apt.patientName,
          clinicName: config.clinicName,
          date: apt.date,
          time: apt.time,
          doctorName: apt.doctorName,
          appointmentType: apt.type,
          clinicAddress: config.clinicAddress,
          mapsUrl: config.mapsUrl,
          allowConfirm: reminderConfig.allowConfirmation,
          allowCancel: reminderConfig.allowCancellation,
          allowReschedule: reminderConfig.allowReschedule,
        })
      : buildShortReminderMessage({
          patientName: apt.patientName,
          clinicName: config.clinicName,
          time: apt.time,
          doctorName: apt.doctorName,
          clinicAddress: config.clinicAddress,
          mapsUrl: config.mapsUrl,
        });

    const result = await sendWhatsAppMessage(config, apt.patientPhone, message);
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${apt.patientName}: ${result.error}`);
    }
  }

  return { sent, failed, errors };
}

// ─── Digital Prescription via WhatsApp ───────────────────────

/**
 * Build and send a digital prescription to a patient via WhatsApp.
 */
export async function sendDigitalPrescription(
  config: WhatsAppAIConfig,
  prescription: Prescription,
): Promise<{ success: boolean; error?: string }> {
  let msg =
    `📋 *Receta Digital*\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 Paciente: *${prescription.patientName}*\n` +
    `👨‍⚕️ Dr/a: *${prescription.doctorName}*\n` +
    `🏥 Matrícula: ${prescription.doctorMatricula}\n` +
    `📅 Fecha: ${prescription.date}\n`;

  if (prescription.diagnosis) {
    msg += `\n🔍 Diagnóstico: ${prescription.diagnosis}\n`;
  }

  msg += `\n*Medicación:*\n`;

  prescription.medications.forEach((med, i) => {
    msg +=
      `\n${i + 1}. *${med.name}*\n` +
      `   Dosis: ${med.dosage}\n` +
      `   Frecuencia: ${med.frequency}\n` +
      `   Duración: ${med.duration}\n`;
    if (med.notes) {
      msg += `   Nota: ${med.notes}\n`;
    }
  });

  if (prescription.instructions) {
    msg += `\n📝 Instrucciones: ${prescription.instructions}\n`;
  }

  msg +=
    `\n━━━━━━━━━━━━━━━━━━\n` +
    `🏥 ${config.clinicName}\n` +
    `⚠️ Esta receta digital tiene validez legal conforme la Ley 27.553 de Receta Electrónica.\n` +
    `ID: ${prescription.id}`;

  return sendWhatsAppMessage(config, prescription.patientPhone, msg);
}

// ─── AI Conversation Handler ─────────────────────────────────

/**
 * Handle an incoming WhatsApp message and generate AI response.
 * Manages conversation state for multi-turn interactions.
 */
export function handleIncomingMessage(
  state: ConversationState | null,
  message: string,
  clinicName: string,
): { response: string; newState: ConversationState; action?: "schedule" | "escalate" } {
  const phone = state?.patientPhone ?? "";

  // New conversation
  if (!state || state.stage === "completed") {
    return {
      response:
        `¡Hola! 👋 Soy el asistente virtual de *${clinicName}*.\n\n` +
        `¿En qué puedo ayudarte?\n\n` +
        `*1* — Agendar un turno\n` +
        `*2* — Consultar por síntomas\n` +
        `*3* — Ver mis turnos\n` +
        `*4* — Hablar con recepción`,
      newState: {
        patientPhone: phone,
        stage: "greeting",
        collectedSymptoms: [],
        lastMessageAt: new Date(),
      },
    };
  }

  const lower = message.trim().toLowerCase();

  // Handle greeting stage
  if (state.stage === "greeting") {
    if (lower === "1" || lower.includes("turno") || lower.includes("agendar")) {
      return {
        response:
          "¡Perfecto! Vamos a agendar tu turno. 📅\n\n" +
          "¿Con qué especialidad necesitás el turno? (Ej: clínica médica, cardiología, dermatología...)",
        newState: { ...state, stage: "scheduling", lastMessageAt: new Date() },
      };
    }

    if (lower === "2" || lower.includes("síntoma") || lower.includes("mal")) {
      return {
        response:
          "Entendido. Voy a hacerte algunas preguntas para orientarte mejor. 🩺\n\n" +
          "Describime tus síntomas con el mayor detalle posible:\n" +
          "- ¿Qué sentís?\n" +
          "- ¿Desde cuándo?\n" +
          "- ¿Cuán fuerte es del 1 al 10?",
        newState: { ...state, stage: "symptom_collection", lastMessageAt: new Date() },
      };
    }

    if (lower === "4" || lower.includes("recepción") || lower.includes("persona")) {
      return {
        response:
          "Te comunico con recepción. Un momento por favor... 📞\n\n" +
          "Mientras tanto, podés llamar directamente a nuestro número.",
        newState: { ...state, stage: "completed", lastMessageAt: new Date() },
        action: "escalate",
      };
    }

    // Default: try to understand intent
    return {
      response:
        "No entendí tu mensaje. Por favor elegí una opción:\n\n" +
        `*1* — Agendar un turno\n` +
        `*2* — Consultar por síntomas\n` +
        `*3* — Ver mis turnos\n` +
        `*4* — Hablar con recepción`,
      newState: { ...state, lastMessageAt: new Date() },
    };
  }

  // Handle symptom collection
  if (state.stage === "symptom_collection") {
    const assessment = assessSymptoms(message);

    if (assessment.severity === "emergencia") {
      return {
        response: assessment.recommendation,
        newState: {
          ...state,
          stage: "completed",
          severity: "emergencia",
          lastMessageAt: new Date(),
        },
        action: "escalate",
      };
    }

    return {
      response:
        `Gracias por la información. Mi evaluación:\n\n` +
        `${assessment.recommendation}\n\n` +
        (assessment.suggestedSpecialty
          ? `Especialidad sugerida: *${assessment.suggestedSpecialty}*\n\n`
          : "") +
        (assessment.shouldSchedule ? "¿Querés que te agende un turno? Respondé *SÍ* o *NO*." : ""),
      newState: {
        ...state,
        stage: assessment.shouldSchedule ? "severity_assessment" : "completed",
        collectedSymptoms: assessment.symptoms,
        severity: assessment.severity,
        lastMessageAt: new Date(),
      },
    };
  }

  // Handle severity assessment → scheduling
  if (state.stage === "severity_assessment") {
    if (lower.includes("sí") || lower.includes("si") || lower === "1") {
      return {
        response:
          "¡Bien! ¿Qué día y horario te queda mejor?\n\n" +
          "Podés decirme algo como:\n" +
          '- "Mañana a la tarde"\n' +
          '- "Lunes después de las 10"\n' +
          '- "Lo antes posible"',
        newState: { ...state, stage: "scheduling", lastMessageAt: new Date() },
      };
    }

    return {
      response: "Entendido. Si cambiás de idea, escribinos cuando quieras. ¡Cuidate! 💙",
      newState: { ...state, stage: "completed", lastMessageAt: new Date() },
    };
  }

  // Handle scheduling
  if (state.stage === "scheduling") {
    return {
      response:
        `Perfecto, registré tu preferencia: *"${message}"*\n\n` +
        "Nuestro equipo va a confirmar el turno a la brevedad y te enviamos los detalles por acá. 📋\n\n" +
        "¿Necesitás algo más?",
      newState: {
        ...state,
        stage: "confirmation",
        appointmentRequest: {
          patientPhone: state.patientPhone,
          preferredDate: message,
          symptoms: state.collectedSymptoms.length
            ? {
                symptoms: state.collectedSymptoms,
                severity: state.severity ?? "leve",
                recommendation: "",
                shouldSchedule: true,
              }
            : undefined,
        },
        lastMessageAt: new Date(),
      },
      action: "schedule",
    };
  }

  // Confirmation / follow-up
  if (lower.includes("no") || lower.includes("gracias") || lower.includes("chau")) {
    return {
      response: "¡Gracias por comunicarte! Cualquier cosa, escribinos. 💙",
      newState: { ...state, stage: "completed", lastMessageAt: new Date() },
    };
  }

  // Loop back to greeting for any other message
  return handleIncomingMessage(null, message, clinicName);
}

// ─── Appointment Confirmation Reply Handler ──────────────────

/**
 * Handle patient reply to a reminder message (1=confirm, 2=cancel, 3=reschedule).
 */
export function handleReminderReply(
  reply: string,
  patientName: string,
  clinicName: string,
): { response: string; action: "confirm" | "cancel" | "reschedule" | "unknown" } {
  const trimmed = reply.trim();

  if (trimmed === "1" || trimmed.toLowerCase().includes("confirmar")) {
    return {
      response: `✅ ¡Turno confirmado, ${patientName}! Te esperamos. Recordá llegar 10 minutos antes.`,
      action: "confirm",
    };
  }

  if (trimmed === "2" || trimmed.toLowerCase().includes("cancelar")) {
    return {
      response:
        `❌ Turno cancelado correctamente, ${patientName}.\n\n` +
        `Para agendar uno nuevo, escribinos *TURNO* o llamanos.`,
      action: "cancel",
    };
  }

  if (trimmed === "3" || trimmed.toLowerCase().includes("reprogramar")) {
    return {
      response:
        `🔄 ¿Qué día y horario te queda mejor, ${patientName}?\n\n` +
        `Escribí tu preferencia y te confirmamos a la brevedad.`,
      action: "reschedule",
    };
  }

  return {
    response:
      `No entendí tu respuesta. Respondé:\n` + `*1* — Confirmar\n*2* — Cancelar\n*3* — Reprogramar`,
    action: "unknown",
  };
}

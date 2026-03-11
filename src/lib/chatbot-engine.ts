/**
 * Cóndor Salud — Patient Chatbot Engine
 *
 * Rule-based NLP engine with healthcare knowledge for the Argentine health system.
 * Handles: FAQs, symptom triage, coverage questions, appointment routing,
 * medication info, and escalation to human support.
 */

// ─── Types ───────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: number;
  quickReplies?: QuickReply[];
  cards?: InfoCard[];
}

export interface QuickReply {
  label: string;
  value: string;
}

export interface InfoCard {
  title: string;
  body: string;
  icon?: string;
  action?: { label: string; url: string };
}

interface IntentMatch {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
}

// ─── Intent Patterns ─────────────────────────────────────────
const INTENTS: {
  intent: string;
  patterns: RegExp[];
  entities?: { key: string; pattern: RegExp }[];
}[] = [
  {
    intent: "greeting",
    patterns: [
      /^(hola|buenas?|hey|buen(os|as)\s+(d[ií]as?|tardes?|noches?))/i,
      /^(hi|hello|que\s+tal|c[oó]mo\s+(and[aá]s?|est[aá]s?))/i,
    ],
  },
  {
    intent: "farewell",
    patterns: [
      /^(chau|adi[oó]s|hasta\s+luego|nos\s+vemos|gracias.*chau)/i,
      /^(bye|gracia[s]?\s*$)/i,
    ],
  },
  {
    intent: "thanks",
    patterns: [/^(gracias|muchas\s+gracias|genial|perfecto|excelente|buenísimo)/i],
  },
  {
    intent: "triage_symptom",
    patterns: [
      /(?:tengo|siento|me\s+duele|me\s+siento|padezco|sufro)\s+(.+)/i,
      /(?:dolor|fiebre|mareo|n[aá]usea|tos|gripe|resfr[ií]o|alergia|infecci[oó]n|presi[oó]n)/i,
      /(?:s[ií]ntoma|malestar|enferm)/i,
      /(?:emergencia|urgencia|grave)/i,
    ],
    entities: [{ key: "symptom", pattern: /(?:tengo|siento|me\s+duele|padezco)\s+(.+)/i }],
  },
  {
    intent: "coverage",
    patterns: [
      /(?:cobertura|obra\s+social|prepaga|pami|osde|swiss\s*medical|galeno|medif[eé])/i,
      /(?:cubre|cubr[ií]|reintegr|autorizaci[oó]n|coseguro)/i,
      /(?:qu[eé]\s+(?:me\s+)?cubre|plan(?:es)?)/i,
    ],
    entities: [
      {
        key: "provider",
        pattern:
          /(?:pami|osde|swiss\s*medical|galeno|medif[eé]|osprera|accord\s*salud|uni[oó]n\s*personal)/i,
      },
    ],
  },
  {
    intent: "appointment",
    patterns: [
      /(?:turno|cita|consulta|reserv|agend|sacar\s+turno|pedir\s+turno)/i,
      /(?:m[eé]dico|doctor|especialista|profesional)/i,
      /(?:cu[aá]ndo|disponib|horario|agenda)/i,
    ],
    entities: [
      {
        key: "specialty",
        pattern:
          /(?:cardi[oó]log|dermat[oó]log|pediatr|ginecol|traumat|neurol|oftalmol|urol|otorrino|psiquiatr|psic[oó]log|nutrici|kinesiolog|clínic[oa]\s*general)/i,
      },
    ],
  },
  {
    intent: "medication",
    patterns: [
      /(?:medicamento|remedio|receta|f[aá]rmaco|droga|pastilla|medicaci[oó]n)/i,
      /(?:farmacia|comprar|retir|entreg)/i,
      /(?:gen[eé]rico|marca|precio|descuento)/i,
    ],
  },
  {
    intent: "telemedicine",
    patterns: [
      /(?:telemedicina|teleconsulta|video\s*consulta|online|virtual|videollamada)/i,
      /(?:consulta\s+(?:por|en)\s+(?:video|l[ií]nea|internet))/i,
    ],
  },
  {
    intent: "pricing",
    patterns: [
      /(?:precio|costo|cuánto\s+(?:sale|cuesta|vale)|tarifa|abono)/i,
      /(?:plan(?:es)?|suscripci[oó]n|pag[oa]|mercado\s*pago)/i,
    ],
  },
  {
    intent: "how_it_works",
    patterns: [
      /(?:c[oó]mo\s+funciona|qu[eé]\s+(?:es|hace)|para\s+qu[eé]\s+sirve)/i,
      /(?:explicame|cont[aá]me|qu[eé]\s+ofrece)/i,
    ],
  },
  {
    intent: "register",
    patterns: [
      /(?:registr|inscrib|crear\s+cuenta|darme\s+de\s+alta|unirme)/i,
      /(?:c[oó]mo\s+(?:me\s+)?(?:registro|inscribo|empiezo))/i,
    ],
  },
  {
    intent: "contact_human",
    patterns: [
      /(?:hablar\s+con\s+(?:alguien|una?\s+persona|humano|agente|operador))/i,
      /(?:atenci[oó]n\s+(?:al\s+)?cliente|soporte|ayuda\s+humana)/i,
    ],
  },
  {
    intent: "location",
    patterns: [
      /(?:d[oó]nde\s+(?:est[aá]n?|queda)|direcci[oó]n|ubicaci[oó]n|sucursal)/i,
      /(?:mapa|zona|barrio|localidad|provincia)/i,
    ],
  },
];

// ─── Symptom Triage DB ───────────────────────────────────────
const SYMPTOM_TRIAGE: Record<
  string,
  { severity: "low" | "medium" | "high" | "emergency"; advice: string; specialty: string }
> = {
  "dolor de cabeza": {
    severity: "low",
    advice:
      "Un dolor de cabeza leve suele aliviarse con descanso, hidratación y un analgésico como paracetamol 500mg. Si persiste más de 72 horas, consultá con un médico clínico.",
    specialty: "Clínica General",
  },
  fiebre: {
    severity: "medium",
    advice:
      "Si tenés fiebre mayor a 38°C, tomá paracetamol o ibuprofeno y mantenete hidratado/a. Si supera los 39°C o dura más de 48 horas, consultá con urgencias.",
    specialty: "Clínica General",
  },
  "dolor de pecho": {
    severity: "emergency",
    advice:
      "El dolor de pecho puede ser una emergencia cardíaca. Llamá al 107 (SAME) o dirigite a la guardia más cercana INMEDIATAMENTE. No te automediques.",
    specialty: "Cardiología",
  },
  "dolor abdominal": {
    severity: "medium",
    advice:
      "El dolor abdominal puede tener muchas causas. Evitá comer alimentos pesados y consultá con un gastroenterólogo si persiste más de 24 horas o es muy intenso.",
    specialty: "Gastroenterología",
  },
  mareo: {
    severity: "medium",
    advice:
      "Los mareos pueden deberse a presión baja, deshidratación o problemas del oído. Sentate, tomá agua y si se repite frecuentemente consultá con un neurólogo.",
    specialty: "Neurología",
  },
  tos: {
    severity: "low",
    advice:
      "Una tos leve puede ser viral. Mantenete hidratado/a y usá miel con limón. Si dura más de 2 semanas o tenés dificultad para respirar, consultá con un neumonólogo.",
    specialty: "Neumonología",
  },
  alergia: {
    severity: "low",
    advice:
      "Para alergias leves, un antihistamínico como loratadina puede ayudar. Si tenés dificultad para respirar o hinchazón en la cara, es una emergencia: llamá al 107.",
    specialty: "Alergia e Inmunología",
  },
  "dificultad para respirar": {
    severity: "emergency",
    advice:
      "La dificultad respiratoria puede ser grave. Llamá al 107 (SAME) inmediatamente o acudí a la guardia más cercana. No esperes.",
    specialty: "Neumonología",
  },
  ansiedad: {
    severity: "medium",
    advice:
      "La ansiedad es tratable. Técnicas de respiración pueden ayudar en el momento. Te recomendamos hacer una consulta con un profesional de salud mental.",
    specialty: "Psiquiatría / Psicología",
  },
  gripe: {
    severity: "low",
    advice:
      "Descansá, tomá líquidos abundantes y paracetamol para la fiebre. Si sos mayor de 65 o tenés enfermedades crónicas, consultá con tu médico de cabecera.",
    specialty: "Clínica General",
  },
  "dolor de garganta": {
    severity: "low",
    advice:
      "Hacé gárgaras con agua tibia y sal, mantené la hidratación. Si tenés fiebre alta o el dolor dura más de 3 días, consultá con un otorrinolaringólogo.",
    specialty: "Otorrinolaringología",
  },
  "dolor de espalda": {
    severity: "low",
    advice:
      "Aplicá calor local, evitá movimientos bruscos y descansá. Si el dolor irradia hacia las piernas o persiste más de una semana, consultá con un traumatólogo.",
    specialty: "Traumatología",
  },
  "presión alta": {
    severity: "high",
    advice:
      "La hipertensión necesita seguimiento médico. Si tenés un pico de presión con dolor de cabeza intenso o visión borrosa, acudí a urgencias. No suspendas tu medicación.",
    specialty: "Cardiología",
  },
};

// ─── Response Generators ─────────────────────────────────────

function generateGreeting(): Partial<ChatMessage> {
  return {
    text: "¡Hola! Soy Cora, la asistente virtual de Cóndor Salud. Estoy acá para ayudarte con consultas de salud, turnos, cobertura y más. ¿En qué puedo asistirte?",
    quickReplies: [
      { label: "Tengo un síntoma", value: "Tengo un síntoma" },
      { label: "Sacar un turno", value: "Quiero sacar un turno" },
      { label: "Consultar cobertura", value: "Quiero consultar mi cobertura" },
      { label: "¿Cómo funciona?", value: "¿Cómo funciona Cóndor Salud?" },
    ],
  };
}

function generateFarewell(): Partial<ChatMessage> {
  return {
    text: "¡Hasta luego! Cuidate mucho. Si necesitás algo más, acá voy a estar. Tu salud es nuestra prioridad.",
  };
}

function generateThanks(): Partial<ChatMessage> {
  return {
    text: "¡De nada! Me alegra poder ayudarte. ¿Hay algo más en lo que pueda asistirte?",
    quickReplies: [
      { label: "Sí, otra consulta", value: "Tengo otra consulta" },
      { label: "No, gracias", value: "Chau, gracias" },
    ],
  };
}

function generateTriageResponse(userMessage: string): Partial<ChatMessage> {
  const lower = userMessage.toLowerCase();

  // Try to match specific symptoms
  for (const [symptom, info] of Object.entries(SYMPTOM_TRIAGE)) {
    if (lower.includes(symptom)) {
      const severityEmoji =
        info.severity === "emergency"
          ? "URGENTE"
          : info.severity === "high"
            ? "IMPORTANTE"
            : info.severity === "medium"
              ? "ATENCIÓN"
              : "INFO";

      const severityBadge =
        info.severity === "emergency" || info.severity === "high" ? `[${severityEmoji}] ` : "";

      return {
        text: `${severityBadge}${info.advice}\n\nEspecialidad recomendada: ${info.specialty}`,
        quickReplies:
          info.severity === "emergency"
            ? [
                { label: "Llamar al 107 (SAME)", value: "Necesito el número de emergencias" },
                { label: "Guardia más cercana", value: "¿Dónde queda la guardia más cercana?" },
              ]
            : [
                {
                  label: `Turno con ${info.specialty}`,
                  value: `Quiero un turno con ${info.specialty}`,
                },
                { label: "Teleconsulta ahora", value: "Quiero una teleconsulta" },
                { label: "Otro síntoma", value: "Tengo otro síntoma" },
              ],
        cards:
          info.severity === "emergency"
            ? [
                {
                  title: "Emergencias - SAME",
                  body: "Línea 107 - Atención médica de emergencia 24/7",
                  icon: "phone",
                  action: { label: "Llamar al 107", url: "tel:107" },
                },
              ]
            : undefined,
      };
    }
  }

  // Generic symptom response
  return {
    text: "Entiendo que no te sentís bien. Para poder orientarte mejor, ¿podrías describirme qué síntomas tenés? Por ejemplo: dolor de cabeza, fiebre, tos, mareos, etc.",
    quickReplies: [
      { label: "Dolor de cabeza", value: "Tengo dolor de cabeza" },
      { label: "Fiebre", value: "Tengo fiebre" },
      { label: "Dolor de pecho", value: "Tengo dolor de pecho" },
      { label: "Dolor abdominal", value: "Tengo dolor abdominal" },
      { label: "Mareos", value: "Siento mareos" },
      { label: "Ansiedad", value: "Tengo ansiedad" },
    ],
  };
}

function generateCoverageResponse(entities: Record<string, string>): Partial<ChatMessage> {
  const provider = entities.provider;

  if (provider) {
    const name = provider.charAt(0).toUpperCase() + provider.slice(1);
    return {
      text: `Cóndor Salud trabaja con ${name} y muchas otras obras sociales y prepagas. Desde tu panel podés:\n\n• Verificar tu cobertura en tiempo real\n• Ver coseguros y montos autorizados\n• Gestionar autorizaciones de prácticas\n• Consultar el vademécum de medicamentos cubiertos\n\n¿Querés que te ayude a verificar tu cobertura?`,
      quickReplies: [
        { label: "Verificar cobertura", value: "Quiero verificar mi cobertura" },
        { label: "Ver planes", value: "¿Qué planes tienen?" },
        { label: "Hablar con alguien", value: "Quiero hablar con un agente" },
      ],
    };
  }

  return {
    text: "Cóndor Salud se integra con las principales obras sociales y prepagas argentinas:\n\n• PAMI\n• OSDE\n• Swiss Medical\n• Galeno\n• Medifé\n• Accord Salud\n• Y muchas más...\n\n¿Con cuál obra social o prepaga necesitás consultar?",
    quickReplies: [
      { label: "PAMI", value: "Tengo PAMI, ¿qué me cubre?" },
      { label: "OSDE", value: "Tengo OSDE, ¿qué me cubre?" },
      { label: "Swiss Medical", value: "Tengo Swiss Medical, ¿qué me cubre?" },
      { label: "Otra", value: "Tengo otra obra social" },
    ],
  };
}

function generateAppointmentResponse(entities: Record<string, string>): Partial<ChatMessage> {
  const specialty = entities.specialty;

  if (specialty) {
    return {
      text: `¡Perfecto! Para sacar un turno de ${specialty}, podés hacerlo directamente desde el Directorio Médico de Cóndor Salud, donde vas a encontrar profesionales con turnos disponibles, puntuaciones de pacientes y verificación de cobertura.\n\nTambién podés optar por una teleconsulta si preferís atención inmediata.`,
      quickReplies: [
        { label: "Ver directorio", value: "Quiero ver el directorio médico" },
        { label: "Teleconsulta", value: "Prefiero una teleconsulta" },
        { label: "Hablar con alguien", value: "Quiero hablar con un agente" },
      ],
      cards: [
        {
          title: "Directorio Médico",
          body: "Buscá profesionales por especialidad, zona y obra social. Turnos online las 24hs.",
          icon: "search",
          action: { label: "Abrir directorio", url: "/dashboard/directorio" },
        },
      ],
    };
  }

  return {
    text: "¡Bien! Para agendar tu turno necesito saber la especialidad. ¿Qué tipo de consulta necesitás?",
    quickReplies: [
      { label: "Clínica General", value: "Turno con Clínica General" },
      { label: "Cardiología", value: "Turno con Cardiología" },
      { label: "Dermatología", value: "Turno con Dermatología" },
      { label: "Pediatría", value: "Turno con Pediatría" },
      { label: "Traumatología", value: "Turno con Traumatología" },
      { label: "Otra especialidad", value: "Otra especialidad" },
    ],
  };
}

function generateMedicationResponse(): Partial<ChatMessage> {
  return {
    text: "Desde Cóndor Salud podés gestionar todo lo relacionado con tus medicamentos:\n\n• Consultar el vademécum con precios actualizados\n• Ver tus recetas electrónicas vigentes\n• Hacer seguimiento de entregas a domicilio\n• Configurar pedidos recurrentes (ej: medicación crónica)\n• Buscar farmacias de guardia cercanas\n\n¿Qué necesitás?",
    quickReplies: [
      { label: "Buscar medicamento", value: "Quiero buscar un medicamento" },
      { label: "Mis recetas", value: "Quiero ver mis recetas" },
      { label: "Farmacia de guardia", value: "¿Dónde hay una farmacia de guardia?" },
      { label: "Pedido a domicilio", value: "Quiero un pedido a domicilio" },
    ],
  };
}

function generateTelemedicineResponse(): Partial<ChatMessage> {
  return {
    text: "La teleconsulta de Cóndor Salud te permite atenderte desde tu casa por videollamada con profesionales matriculados.\n\n• Consultas de Clínica General, Psicología, Nutrición y más\n• Receta electrónica al instante\n• Resumen de consulta por WhatsApp\n• Disponible de lunes a sábados de 8 a 22hs\n\nLa primera teleconsulta tiene un costo de $4.500 o puede estar cubierta por tu obra social.",
    quickReplies: [
      { label: "Iniciar teleconsulta", value: "Quiero iniciar una teleconsulta ahora" },
      { label: "Agendar para después", value: "Quiero agendar una teleconsulta" },
      { label: "¿Acepta mi obra social?", value: "¿La teleconsulta acepta mi obra social?" },
    ],
    cards: [
      {
        title: "Teleconsulta",
        body: "Conectate con un médico en minutos. Sin salir de tu casa.",
        icon: "video",
        action: { label: "Ir a Telemedicina", url: "/dashboard/telemedicina" },
      },
    ],
  };
}

function generatePricingResponse(): Partial<ChatMessage> {
  return {
    text: "Cóndor Salud tiene planes pensados para cada necesidad:\n\n• Plan Esencial — Gratis\n  Verificación de cobertura, directorio médico básico\n\n• Plan Profesional — $12.900/mes\n  Facturación PAMI, recetas electrónicas, telemedicina\n\n• Plan Institución — $34.900/mes\n  Multi-sede, analytics, integraciones completas, soporte premium\n\nTodos los planes incluyen 14 días de prueba gratis.",
    quickReplies: [
      { label: "Probar gratis", value: "Quiero probar gratis" },
      { label: "Comparar planes", value: "Quiero comparar los planes en detalle" },
      { label: "Hablar con ventas", value: "Quiero hablar con alguien de ventas" },
    ],
    cards: [
      {
        title: "Probá Cóndor Salud gratis",
        body: "14 días sin compromiso. Sin tarjeta de crédito.",
        icon: "star",
        action: { label: "Registrarme", url: "/auth/registro" },
      },
    ],
  };
}

function generateHowItWorksResponse(): Partial<ChatMessage> {
  return {
    text: "Cóndor Salud es una plataforma unificada para el sistema de salud argentino. Conectamos pacientes, médicos, obras sociales y farmacias en un solo lugar.\n\nLo que podés hacer:\n\n1. Verificar tu cobertura al instante\n2. Sacar turnos con especialistas verificados\n3. Atenderte por videollamada (teleconsulta)\n4. Gestionar recetas y entregas de medicamentos\n5. Hacer un auto-triage inteligente de síntomas\n6. Recibir recordatorios por WhatsApp\n\nTodo integrado con PAMI, OSDE, Swiss Medical, Galeno y más.",
    quickReplies: [
      { label: "Registrarme", value: "Quiero registrarme" },
      { label: "Ver precios", value: "¿Cuánto cuesta?" },
      { label: "Probar demo", value: "Quiero ver una demo" },
    ],
  };
}

function generateRegisterResponse(): Partial<ChatMessage> {
  return {
    text: "Registrarte en Cóndor Salud es gratis y solo toma 2 minutos:\n\n1. Ingresá tu email y creá una contraseña\n2. Completá tus datos personales y obra social\n3. ¡Listo! Ya podés usar la plataforma\n\nNo necesitás tarjeta de crédito para empezar.",
    quickReplies: [
      { label: "Registrarme ahora", value: "Quiero registrarme ahora" },
      { label: "Tengo dudas", value: "Tengo dudas antes de registrarme" },
    ],
    cards: [
      {
        title: "Crear cuenta",
        body: "Empezá en 2 minutos. Sin tarjeta de crédito.",
        icon: "user-plus",
        action: { label: "Registrarme", url: "/auth/registro" },
      },
    ],
  };
}

function generateContactHumanResponse(): Partial<ChatMessage> {
  return {
    text: "¡Por supuesto! Te conecto con nuestro equipo de atención al paciente. Podés comunicarte por:\n\n• WhatsApp: +54 9 11 1234-5678 (respuesta en minutos)\n• Email: soporte@condorsalud.com.ar\n• Teléfono: 0800-333-SALUD (lunes a viernes 9 a 18hs)\n\n¿Preferís que te derivemos por WhatsApp ahora?",
    quickReplies: [
      { label: "Ir a WhatsApp", value: "Sí, derivame a WhatsApp" },
      { label: "Seguir acá", value: "Prefiero seguir por acá" },
    ],
    cards: [
      {
        title: "WhatsApp - Atención al paciente",
        body: "Chateá con nuestro equipo. Respuesta promedio: 3 minutos.",
        icon: "message-circle",
        action: {
          label: "Abrir WhatsApp",
          url: "https://wa.me/5491112345678?text=Hola%2C%20necesito%20ayuda%20con%20C%C3%B3ndor%20Salud",
        },
      },
    ],
  };
}

function generateLocationResponse(): Partial<ChatMessage> {
  return {
    text: "Cóndor Salud es 100% digital — podés usarlo desde cualquier lugar de Argentina.\n\nPero si necesitás atención presencial, desde nuestro Directorio Médico podés encontrar consultorios, clínicas y hospitales cerca tuyo, filtrados por zona y obra social.",
    quickReplies: [
      { label: "Buscar consultorios", value: "Buscar consultorios cerca" },
      { label: "Farmacia cercana", value: "¿Dónde hay una farmacia de guardia?" },
    ],
  };
}

function generateFallback(): Partial<ChatMessage> {
  return {
    text: "Disculpá, no estoy segura de haber entendido bien tu consulta. ¿Podrías reformularla? También podés elegir una de estas opciones:",
    quickReplies: [
      { label: "Tengo un síntoma", value: "Tengo un síntoma" },
      { label: "Sacar turno", value: "Quiero sacar un turno" },
      { label: "Consultar cobertura", value: "Quiero consultar mi cobertura" },
      { label: "Hablar con alguien", value: "Quiero hablar con un agente" },
    ],
  };
}

// ─── Intent Detection ────────────────────────────────────────

function detectIntent(message: string): IntentMatch {
  const lower = message.toLowerCase().trim();
  let bestMatch: IntentMatch = { intent: "unknown", confidence: 0, entities: {} };

  for (const { intent, patterns, entities: entityDefs } of INTENTS) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        const confidence = lower.length < 6 ? 0.7 : 0.9;
        if (confidence > bestMatch.confidence) {
          const entities: Record<string, string> = {};
          if (entityDefs) {
            for (const { key, pattern: ep } of entityDefs) {
              const match = lower.match(ep);
              if (match) {
                entities[key] = match[1] || match[0];
              }
            }
          }
          bestMatch = { intent, confidence, entities };
        }
      }
    }
  }

  return bestMatch;
}

// ─── Main Engine ─────────────────────────────────────────────

export function processMessage(userMessage: string): Partial<ChatMessage> {
  const { intent, entities } = detectIntent(userMessage);

  switch (intent) {
    case "greeting":
      return generateGreeting();
    case "farewell":
      return generateFarewell();
    case "thanks":
      return generateThanks();
    case "triage_symptom":
      return generateTriageResponse(userMessage);
    case "coverage":
      return generateCoverageResponse(entities);
    case "appointment":
      return generateAppointmentResponse(entities);
    case "medication":
      return generateMedicationResponse();
    case "telemedicine":
      return generateTelemedicineResponse();
    case "pricing":
      return generatePricingResponse();
    case "how_it_works":
      return generateHowItWorksResponse();
    case "register":
      return generateRegisterResponse();
    case "contact_human":
      return generateContactHumanResponse();
    case "location":
      return generateLocationResponse();
    default:
      return generateFallback();
  }
}

export function getWelcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "bot",
    timestamp: Date.now(),
    text: "¡Hola! Soy Cora, tu asistente virtual de Cóndor Salud. Estoy acá para ayudarte con consultas médicas, turnos, cobertura y mucho más. ¿En qué puedo ayudarte hoy?",
    quickReplies: [
      { label: "Tengo un síntoma", value: "Tengo un síntoma" },
      { label: "Sacar un turno", value: "Quiero sacar un turno" },
      { label: "Consultar cobertura", value: "Quiero consultar mi cobertura" },
      { label: "Teleconsulta", value: "Quiero una teleconsulta" },
      { label: "¿Cómo funciona?", value: "¿Cómo funciona Cóndor Salud?" },
    ],
  };
}

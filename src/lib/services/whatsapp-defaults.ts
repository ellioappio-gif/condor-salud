type OperatingHoursInput = Record<string, { open: string; close: string }> | null | undefined;

export interface DefaultWhatsAppSetupInput {
  clinicName: string;
  whatsappNumber?: string | null;
  clinicPhone?: string | null;
  clinicAddress?: string | null;
  bookingUrl?: string | null;
  operatingHours?: OperatingHoursInput;
}

interface DefaultWhatsAppTemplate {
  name: string;
  category: "utility";
  language: "es_AR";
  body_template: string;
  variables: string[];
  header_text: string;
  active: boolean;
}

const DEFAULT_SCHEDULE = {
  lun: { open: "09:00", close: "18:00" },
  mar: { open: "09:00", close: "18:00" },
  mie: { open: "09:00", close: "18:00" },
  jue: { open: "09:00", close: "18:00" },
  vie: { open: "09:00", close: "18:00" },
  sab: null,
  dom: null,
} as const;

function buildBusinessHours(operatingHours?: OperatingHoursInput) {
  const mergedSchedule = {
    lun: operatingHours?.lun ?? DEFAULT_SCHEDULE.lun,
    mar: operatingHours?.mar ?? DEFAULT_SCHEDULE.mar,
    mie: operatingHours?.mie ?? DEFAULT_SCHEDULE.mie,
    jue: operatingHours?.jue ?? DEFAULT_SCHEDULE.jue,
    vie: operatingHours?.vie ?? DEFAULT_SCHEDULE.vie,
    sab: operatingHours?.sab ?? DEFAULT_SCHEDULE.sab,
    dom: operatingHours?.dom ?? DEFAULT_SCHEDULE.dom,
  };

  const scheduleValues = Object.values(mergedSchedule).filter(
    (day): day is { open: string; close: string } => Boolean(day),
  );

  const firstOpen = scheduleValues[0]?.open ?? "09:00";
  const lastClose = scheduleValues.at(-1)?.close ?? "18:00";

  return JSON.stringify({
    hours: `${firstOpen}-${lastClose}`,
    hoursBeforeFirst: 24,
    hoursBeforeSecond: 2,
    confirmationReply: true,
    cancellationReply: true,
    rescheduleReply: true,
    includeGoogleMaps: false,
    includeClinicPhone: true,
    includePreparation: false,
    schedule: mergedSchedule,
  });
}

function optionalSection(value?: string | null, prefix = "") {
  if (!value?.trim()) return "";
  return `${prefix}${value.trim()}`;
}

export function buildDefaultWhatsAppSetup(input: DefaultWhatsAppSetupInput) {
  const clinicName = input.clinicName.trim();
  const bookingUrl = input.bookingUrl?.trim() || "";
  const clinicPhone = input.clinicPhone?.trim() || "";
  const clinicAddress = input.clinicAddress?.trim() || "";
  const whatsappNumber = input.whatsappNumber?.trim() || clinicPhone || "";
  const bookingLine = optionalSection(bookingUrl, "\n\nTambién podés reservar online: ");
  const bookingShortLine = optionalSection(bookingUrl, "\n🌐 Online: ");
  const phoneLine = optionalSection(clinicPhone, "\n📞 Teléfono: ");
  const addressLine = optionalSection(clinicAddress, "\n📍 Dirección: ");

  const config = {
    whatsapp_number: whatsappNumber,
    display_name: clinicName,
    welcome_message:
      `¡Hola! 👋 Gracias por comunicarte con *${clinicName}*.\n\n` +
      "Podemos ayudarte con turnos, consultas y recepción.\n\n" +
      "*1* — Sacar turno\n" +
      "*2* — Consultar turnos existentes\n" +
      "*3* — Hablar con recepción" +
      bookingLine,
    auto_reply: true,
    business_hours: buildBusinessHours(input.operatingHours),
    out_of_hours_message:
      "Nuestro horario de atención es de *lunes a viernes de 09:00 a 18:00*.\n\n" +
      "Te responderemos a primera hora del próximo día hábil." +
      bookingLine,
    notify_on_new_lead: true,
  };

  const templates: DefaultWhatsAppTemplate[] = [
    {
      name: "reminder-24h",
      category: "utility",
      language: "es_AR",
      body_template:
        `Hola {{paciente_nombre}}, te recordamos tu turno en *${clinicName}*:\n\n` +
        "📅 Fecha: *{{turno_fecha}}*\n" +
        "🕐 Hora: *{{turno_hora}}*\n" +
        "👨‍⚕️ Profesional: *{{profesional_nombre}}*\n" +
        "📋 Tipo: {{turno_tipo}}" +
        addressLine +
        "\n\nRespondé:\n*1* — Confirmar turno ✅\n*2* — Cancelar turno ❌\n*3* — Reprogramar 📅",
      variables: [
        "paciente_nombre",
        "turno_fecha",
        "turno_hora",
        "profesional_nombre",
        "turno_tipo",
      ],
      header_text: "Recordatorio de turno — 24 horas antes",
      active: true,
    },
    {
      name: "reminder-2h",
      category: "utility",
      language: "es_AR",
      body_template:
        `Hola {{paciente_nombre}}, tu turno es *hoy a las {{turno_hora}}* con *{{profesional_nombre}}*.` +
        addressLine +
        phoneLine +
        "\n\n¡Te esperamos!",
      variables: ["paciente_nombre", "turno_hora", "profesional_nombre"],
      header_text: "Recordatorio de turno — 2 horas antes",
      active: true,
    },
    {
      name: "confirmation",
      category: "utility",
      language: "es_AR",
      body_template:
        `✅ Hola {{paciente_nombre}}, tu turno fue agendado en *${clinicName}*:\n\n` +
        "📅 Fecha: *{{turno_fecha}}*\n" +
        "🕐 Hora: *{{turno_hora}}*\n" +
        "👨‍⚕️ Profesional: *{{profesional_nombre}}*\n" +
        "📋 Tipo: {{turno_tipo}}\n" +
        "💳 Financiador: {{financiador}}" +
        addressLine +
        "\n\n24 hs antes te enviaremos un recordatorio.\nRespondé *CANCELAR* si necesitás cancelar.",
      variables: [
        "paciente_nombre",
        "turno_fecha",
        "turno_hora",
        "profesional_nombre",
        "turno_tipo",
        "financiador",
      ],
      header_text: "Confirmación de turno nuevo",
      active: true,
    },
    {
      name: "cancellation",
      category: "utility",
      language: "es_AR",
      body_template:
        "Hola {{paciente_nombre}}, tu turno del *{{turno_fecha}}* a las *{{turno_hora}}* fue cancelado correctamente.\n\n" +
        "Para agendar uno nuevo:" +
        bookingShortLine +
        phoneLine +
        "\n💬 O respondé *TURNO* por acá.",
      variables: ["paciente_nombre", "turno_fecha", "turno_hora"],
      header_text: "Cancelación de turno",
      active: true,
    },
    {
      name: "reschedule",
      category: "utility",
      language: "es_AR",
      body_template:
        `🔄 Hola {{paciente_nombre}}, tu turno fue reprogramado:\n\n` +
        "📅 Nueva fecha: *{{turno_fecha}}*\n" +
        "🕐 Nueva hora: *{{turno_hora}}*\n" +
        "👨‍⚕️ Profesional: *{{profesional_nombre}}*" +
        addressLine +
        "\n\nRespondé *CANCELAR* si necesitás cancelar.",
      variables: ["paciente_nombre", "turno_fecha", "turno_hora", "profesional_nombre"],
      header_text: "Turno reprogramado",
      active: true,
    },
    {
      name: "post-visit",
      category: "utility",
      language: "es_AR",
      body_template:
        `Hola {{paciente_nombre}}, gracias por visitarnos en *${clinicName}* 🏥\n\n` +
        "Esperamos que tu consulta con *{{profesional_nombre}}* haya sido de tu agrado." +
        phoneLine +
        "\n\n¡Gracias por confiar en nosotros!",
      variables: ["paciente_nombre", "profesional_nombre"],
      header_text: "Post-visita — 1 hora después",
      active: false,
    },
    {
      name: "follow-up-results",
      category: "utility",
      language: "es_AR",
      body_template:
        "Hola {{paciente_nombre}}, te informamos que los resultados de tu estudio de *{{tipo_estudio}}* ya están disponibles." +
        addressLine +
        phoneLine +
        "\n\nSi tenés consultas, respondé este mensaje.",
      variables: ["paciente_nombre", "tipo_estudio"],
      header_text: "Resultados disponibles",
      active: true,
    },
  ];

  return { config, templates };
}

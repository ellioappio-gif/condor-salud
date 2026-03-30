import type { TourConfig } from "@/components/GuidedTour";

// ─── Tour: Registrar un paciente nuevo ───────────────────────

export const TOUR_ADD_PATIENT: TourConfig = {
  id: "recepcion-add-patient",
  name: "Como registrar un paciente",
  showOnce: true,
  steps: [
    {
      target: "tab-leads",
      title: "Pestaña de consultas nuevas",
      description:
        'Los pacientes nuevos se registran primero como "consultas". Asegurate de estar en esta pestaña para empezar.',
      placement: "bottom",
    },
    {
      target: "btn-nueva-consulta",
      title: "Crear una nueva consulta",
      description:
        "Hace clic en este boton para registrar a un paciente nuevo. Se crea una ficha que podes completar con sus datos.",
      placement: "bottom",
    },
    {
      target: "leads-search",
      title: "Buscar consultas existentes",
      description:
        "Usa este buscador para encontrar consultas ya cargadas por nombre, telefono o email. Asi evitas duplicados.",
      placement: "bottom",
    },
    {
      target: "leads-pipeline",
      title: "Pipeline de seguimiento",
      description:
        'Cada consulta pasa por etapas: Nuevo, Contactado, Interesado, Turno agendado, Convertido. Cuando llegas a "Convertido", el paciente aparece automaticamente en la lista de pacientes.',
      placement: "top",
    },
    {
      target: "tab-pacientes",
      title: "Lista de pacientes",
      description:
        "Aca ves todos los pacientes ya convertidos del centro. Podes buscar por nombre o DNI y acceder a la ficha de cada uno.",
      placement: "bottom",
    },
    {
      target: "pacientes-search",
      title: "Buscar pacientes",
      description:
        'Escribi el nombre o DNI del paciente para encontrarlo rapidamente. Despues hace clic en "Ver ficha" para ver sus datos completos.',
      placement: "bottom",
    },
  ],
};

// ─── Tour: Agendar un turno ──────────────────────────────────

export const TOUR_SCHEDULE_APPOINTMENT: TourConfig = {
  id: "recepcion-schedule-appointment",
  name: "Como agendar un turno",
  showOnce: true,
  steps: [
    {
      target: "btn-nuevo-turno",
      title: "Crear un nuevo turno",
      description:
        "Este boton abre el formulario para agendar un turno. Vas a poder elegir la fecha, hora, paciente, profesional y tipo de consulta.",
      placement: "bottom",
    },
    {
      target: "agenda-view-toggle",
      title: "Cambiar la vista",
      description:
        '"Semana" muestra el calendario con los horarios de lunes a sabado. "Lista" muestra una tabla con todos los turnos donde podes confirmar, atender o cancelar cada uno.',
      placement: "bottom",
    },
    {
      target: "agenda-profesional-filter",
      title: "Filtrar por profesional",
      description:
        'Usa estos botones para ver los turnos de un profesional en particular, o selecciona "Todos" para ver la agenda completa.',
      placement: "bottom",
    },
    {
      target: "agenda-kpi",
      title: "Resumen del dia",
      description:
        "Aca ves de un vistazo cuantos turnos hay en total, cuantos estan confirmados, pendientes y atendidos.",
      placement: "bottom",
    },
    {
      target: "agenda-table",
      title: "Tabla de turnos",
      description:
        "En cada turno podes: hacer clic en el boton verde para CONFIRMAR, en el reloj para marcar ATENDIDO, o en la X roja para CANCELAR. El estado cambia de color automaticamente.",
      placement: "top",
    },
  ],
};

// ─── Tour: Gestionar turnos online ───────────────────────────

export const TOUR_ONLINE_BOOKINGS: TourConfig = {
  id: "recepcion-online-bookings",
  name: "Como gestionar turnos online",
  showOnce: true,
  steps: [
    {
      target: "turnos-online-url",
      title: "Enlace publico de reservas",
      description:
        "Este es el enlace que los pacientes usan para sacar turno por internet. Podes copiarlo y mandarlo por WhatsApp.",
      placement: "bottom",
    },
    {
      target: "turnos-online-filters",
      title: "Filtrar por estado y fecha",
      description:
        "Usa estos filtros para ver solo los turnos pendientes, confirmados o cancelados. Tambien podes filtrar por fecha.",
      placement: "bottom",
    },
    {
      target: "turnos-online-table",
      title: "Lista de turnos recibidos",
      description:
        "Aca aparecen todos los turnos que los pacientes sacaron desde la web. Cada fila muestra el paciente, el medico que eligio, la fecha y el estado actual.",
      placement: "top",
    },
    {
      target: "turnos-online-actions",
      title: "Confirmar o cancelar turnos",
      description:
        'Para los turnos pendientes: hace clic en "Confirmar" si todo esta bien, o en "Cancelar" si hay algun problema. Despues de la consulta, podes marcar "Completar" o "No asistio".',
      placement: "left",
    },
  ],
};

// ─── Tour: Disponibilidad de profesionales ───────────────────

export const TOUR_AVAILABILITY: TourConfig = {
  id: "recepcion-availability",
  name: "Como ver la disponibilidad de los profesionales",
  showOnce: true,
  steps: [
    {
      target: "disponibilidad-doctor-select",
      title: "Seleccionar profesional",
      description:
        "Elegi el medico o profesional del que quieras ver o modificar la disponibilidad. La grilla se actualiza automaticamente.",
      placement: "bottom",
    },
    {
      target: "disponibilidad-week-nav",
      title: "Navegar por semanas",
      description:
        'Usa las flechas para ir a la semana anterior o siguiente. El boton "Hoy" te lleva de vuelta a la semana actual.',
      placement: "bottom",
    },
    {
      target: "disponibilidad-grid",
      title: "Grilla de horarios",
      description:
        "Los colores te indican el estado de cada horario: VERDE = disponible para agendar turnos, ROJO = ya tiene turno (no se puede quitar), GRIS = no disponible.",
      placement: "top",
    },
    {
      target: "disponibilidad-grid",
      title: "Agregar o quitar horarios",
      description:
        "Hace clic en un horario GRIS para marcarlo como disponible (va a aparecer con borde celeste punteado). Hace clic en un horario VERDE para quitarlo (borde rojo punteado). Los cambios no se guardan hasta que hagas clic en el boton Guardar.",
      placement: "top",
    },
    {
      target: "disponibilidad-save",
      title: "Guardar los cambios",
      description:
        "Este boton aparece cuando tenes cambios pendientes. Hace clic para aplicar las modificaciones. Si no guardas, los cambios se pierden.",
      placement: "bottom",
    },
  ],
};

// ─── All tours for receptionist ──────────────────────────────

export const RECEPTIONIST_TOURS = [
  TOUR_ADD_PATIENT,
  TOUR_SCHEDULE_APPOINTMENT,
  TOUR_ONLINE_BOOKINGS,
  TOUR_AVAILABILITY,
];

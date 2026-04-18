"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Search,
  Filter,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/i18n/context";
import {
  useMyAppointments,
  useDoctorDirectory,
  useAvailableSlots,
  useCreateBooking,
  useCancelBooking,
} from "@/hooks/use-patient-data";
import type { PatientAppointment } from "@/lib/services/patient-data";
import RideOptionsCard from "@/components/RideOptionsCard";
import RideChatbot from "@/components/RideChatbot";
import { MessageCircle } from "lucide-react";

/* ── types ────────────────────────────────────────────── */
type Tab = "proximos" | "historial";
type AppointmentStatus = PatientAppointment["status"];

/* ── demo data removed — now using SWR hooks ─────────── */

const specialties = [
  "Clínica Médica",
  "Cardiología",
  "Dermatología",
  "Ginecología",
  "Traumatología",
  "Pediatría",
  "Oftalmología",
  "Neurología",
  "Endocrinología",
  "Nutrición",
];

/* ── status badge ─────────────────────────────────────── */
function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useLocale();
  const map: Record<AppointmentStatus, { label: string; cls: string }> = {
    confirmado: { label: t("patient.confirmed"), cls: "bg-success-50 text-success-700" },
    pendiente: { label: t("patient.pendingStatus"), cls: "bg-amber-50 text-amber-700" },
    cancelado: { label: t("patient.cancelledStatus"), cls: "bg-red-50 text-red-600" },
    completado: { label: t("patient.completedStatus"), cls: "bg-ink-50 text-ink-400" },
  };
  const { label, cls } = map[status];
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

/* ── component ────────────────────────────────────────── */
export default function TurnosPage() {
  const { showToast } = useToast();
  const { t, locale } = useLocale();
  const router = useRouter();
  const { data: fetchedAppointments } = useMyAppointments();
  const { data: doctors } = useDoctorDirectory();
  const { trigger: doCreateBooking } = useCreateBooking();
  const { trigger: doCancelBooking } = useCancelBooking();

  const [tab, setTab] = useState<Tab>("proximos");
  const [showBooking, setShowBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>();
  const [bookingType, setBookingType] = useState<"presencial" | "teleconsulta">("presencial");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState<PatientAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Fetch real available slots when specialty + date are chosen
  const { data: availableSlots, isLoading: slotsLoading } = useAvailableSlots(
    selectedSpecialty,
    selectedDate,
  );

  const [localAppointments, setLocalAppointments] = useState<PatientAppointment[]>([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatContext, setChatContext] = useState<{
    doctorName: string;
    address: string;
    specialty?: string;
    bookingDate?: string;
    bookingTime?: string;
  } | null>(null);

  // Sync fetched data into local state for optimistic updates
  useEffect(() => {
    if (fetchedAppointments) setLocalAppointments(fetchedAppointments);
  }, [fetchedAppointments]);

  // Filtered doctors for the selected specialty
  const filteredDoctors =
    doctors?.filter((d) => d.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())) ??
    [];

  const upcoming = localAppointments.filter(
    (a) => a.status === "confirmado" || a.status === "pendiente",
  );
  const history = localAppointments.filter(
    (a) => a.status === "completado" || a.status === "cancelado",
  );

  const resetBooking = () => {
    setShowBooking(false);
    setBookingStep(1);
    setSelectedSpecialty("");
    setSelectedDate("");
    setSelectedTime("");
    setSelectedDoctorId(undefined);
    setBookingType("presencial");
    setIsSubmitting(false);
  };

  /** Returns true if an appointment is within 2 hours from now */
  const isWithin2Hours = (apt: PatientAppointment) => {
    try {
      const aptTime = new Date(`${apt.date}T${apt.time}`);
      return aptTime.getTime() - Date.now() < 2 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleApt || !rescheduleDate || !rescheduleTime) return;
    setIsRescheduling(true);
    // Optimistic update
    setLocalAppointments((prev) =>
      prev.map((a) =>
        a.id === rescheduleApt.id
          ? {
              ...a,
              date: rescheduleDate,
              time: rescheduleTime,
              status: "pendiente" as AppointmentStatus,
            }
          : a,
      ),
    );
    showToast(t("patient.appointmentRescheduled"));
    try {
      await fetch(`/api/appointments/${rescheduleApt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: rescheduleDate, time: rescheduleTime, status: "pendiente" }),
      });
    } catch {
      // Revert
      setLocalAppointments((prev) =>
        prev.map((a) => (a.id === rescheduleApt.id ? rescheduleApt : a)),
      );
      showToast(t("patient.rescheduleError"));
    }
    setRescheduleApt(null);
    setRescheduleDate("");
    setRescheduleTime("");
    setIsRescheduling(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">
            {t("patient.myAppointments")}
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">{t("patient.manageAppointments")}</p>
        </div>
        <button
          onClick={() => setShowBooking(true)}
          className="inline-flex items-center gap-2 bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold px-5 py-2.5 rounded-[4px] transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t("patient.bookAppointment")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ink-50 rounded-xl p-1 w-fit">
        {(
          [
            ["proximos", t("patient.upcoming")],
            ["historial", t("patient.history")],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Appointment list */}
      <div className="bg-white rounded-2xl border border-border-light divide-y divide-border-light overflow-hidden">
        {(tab === "proximos" ? upcoming : history).map((apt) => (
          <div
            key={apt.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-surface/50 transition"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                apt.type === "teleconsulta" ? "bg-success-50" : "bg-celeste-50"
              }`}
            >
              {apt.type === "teleconsulta" ? (
                <Video className="w-5 h-5 text-success-600" />
              ) : (
                <Calendar className="w-5 h-5 text-celeste-dark" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-ink">{apt.doctor}</p>
                <StatusBadge status={apt.status} />
              </div>
              <p className="text-xs text-ink-muted mt-0.5">{apt.specialty}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(apt.date).toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {apt.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {apt.location}
                </span>
              </div>
            </div>
            {(apt.status === "confirmado" || apt.status === "pendiente") && (
              <div className="flex gap-2 shrink-0">
                {apt.type === "teleconsulta" && (
                  <button
                    onClick={() => {
                      showToast(t("patient.connectingTeleconsulta"));
                      window.location.href = "/paciente/teleconsulta";
                    }}
                    className="text-xs font-medium bg-success-50 text-success-700 px-3 py-1.5 rounded-[4px] hover:bg-success-100 transition"
                  >
                    {t("patient.joinCall")}
                  </button>
                )}
                {apt.type === "presencial" && (
                  <button
                    onClick={() => {
                      setChatContext({
                        doctorName: apt.doctor,
                        address: apt.location,
                        specialty: apt.specialty,
                        bookingDate: apt.date,
                        bookingTime: apt.time,
                      });
                      setShowChatbot(true);
                    }}
                    className="text-xs font-medium bg-celeste-50 text-celeste-dark px-3 py-1.5 rounded-[4px] hover:bg-celeste-100 transition flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    {t("patient.transport")}
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (isWithin2Hours(apt)) {
                      showToast(t("patient.cannotCancelWithin2Hours"));
                      return;
                    }
                    // Optimistic: update local state immediately
                    setLocalAppointments((prev) =>
                      prev.map((a) =>
                        a.id === apt.id ? { ...a, status: "cancelado" as AppointmentStatus } : a,
                      ),
                    );
                    showToast(t("patient.appointmentCancelled"));
                    // Fire real API call
                    try {
                      await doCancelBooking(apt.id, t("patient.cancelledByPatient"));
                    } catch {
                      // Revert on failure
                      setLocalAppointments((prev) =>
                        prev.map((a) => (a.id === apt.id ? { ...a, status: apt.status } : a)),
                      );
                      showToast(t("patient.cancelError"));
                    }
                  }}
                  disabled={isWithin2Hours(apt)}
                  title={isWithin2Hours(apt) ? t("patient.cannotCancelWithin2Hours") : undefined}
                  className="text-xs font-medium bg-red-50 text-red-600 px-3 py-1.5 rounded-[4px] hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("patient.cancelAppointment")}
                </button>
                <button
                  onClick={() => {
                    if (isWithin2Hours(apt)) {
                      showToast(t("patient.cannotRescheduleWithin2Hours"));
                      return;
                    }
                    setRescheduleApt(apt);
                    setRescheduleDate("");
                    setRescheduleTime("");
                  }}
                  disabled={isWithin2Hours(apt)}
                  title={
                    isWithin2Hours(apt) ? t("patient.cannotRescheduleWithin2Hours") : undefined
                  }
                  className="text-xs font-medium bg-celeste-50 text-celeste-dark px-3 py-1.5 rounded-[4px] hover:bg-celeste-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("patient.reschedule")}
                </button>
              </div>
            )}
            {/* Ride options for confirmed in-person appointments */}
            {apt.status === "confirmado" && apt.type === "presencial" && (
              <div className="w-full mt-2">
                <RideOptionsCard
                  doctor={{ name: apt.doctor, address: apt.location }}
                  booking={{ specialty: apt.specialty, date: apt.date, time: apt.time }}
                  compact
                />
              </div>
            )}
          </div>
        ))}
        {(tab === "proximos" ? upcoming : history).length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-ink-muted">
            {tab === "proximos" ? t("patient.noUpcoming") : t("patient.noHistory")}
          </div>
        )}
      </div>

      {/* ── Ride Chatbot modal ─────────────────────────── */}
      {showChatbot && chatContext && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowChatbot(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowChatbot(false)}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl h-[70vh] flex flex-col overflow-hidden">
            <RideChatbot preloadContext={chatContext} onClose={() => setShowChatbot(false)} />
          </div>
        </div>
      )}

      {/* ── Booking modal ────────────────────────────────── */}
      {showBooking && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && resetBooking()}
          onKeyDown={(e) => e.key === "Escape" && resetBooking()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("patient.newAppointmentTitle")}
            className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <h2 className="text-lg font-bold text-ink">{t("patient.newAppointmentTitle")}</h2>
              <button
                onClick={resetBooking}
                aria-label={t("patient.closeModal")}
                className="p-1 text-ink-muted hover:text-ink transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="px-6 py-3 flex items-center gap-2 text-xs font-medium">
              {[
                t("patient.stepSpecialty"),
                t("patient.stepDate"),
                t("patient.stepTime"),
                t("patient.stepConfirm"),
              ].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      bookingStep > i + 1
                        ? "bg-success-100 text-success-700"
                        : bookingStep === i + 1
                          ? "bg-celeste-dark text-white"
                          : "bg-ink-50 text-ink-300"
                    }`}
                  >
                    {bookingStep > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={bookingStep >= i + 1 ? "text-ink" : "text-ink-300"}>{s}</span>
                  {i < 3 && <ChevronRight className="w-3.5 h-3.5 text-ink-200" />}
                </div>
              ))}
            </div>

            <div className="px-6 py-4">
              {/* Step 1: Specialty */}
              {bookingStep === 1 && (
                <div className="space-y-2">
                  <p className="text-sm text-ink-muted mb-3">
                    {t("patient.selectSpecialtyPrompt")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {specialties.map((sp) => (
                      <button
                        key={sp}
                        onClick={() => {
                          setSelectedSpecialty(sp);
                          setBookingStep(2);
                        }}
                        className={`text-left text-sm px-3 py-2.5 rounded-xl border transition ${
                          selectedSpecialty === sp
                            ? "border-celeste-dark bg-celeste-50 text-celeste-dark font-semibold"
                            : "border-border-light hover:border-celeste-200 text-ink-500"
                        }`}
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Date */}
              {bookingStep === 2 && (
                <div className="space-y-3">
                  <p className="text-sm text-ink-muted">
                    {t("patient.selectDateFor")} {selectedSpecialty}
                  </p>
                  <input
                    type="date"
                    aria-label={t("patient.appointmentDate")}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setBookingStep(3);
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-celeste-200 focus:border-celeste-dark"
                  />
                </div>
              )}

              {/* Step 3: Time */}
              {bookingStep === 3 && (
                <div className="space-y-3">
                  <p className="text-sm text-ink-muted">
                    {t("patient.timeSlotsFor")}{" "}
                    {new Date(selectedDate + "T12:00").toLocaleDateString(
                      locale === "en" ? "en-US" : "es-AR",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      },
                    )}
                  </p>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-8 text-ink-muted">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {t("patient.loadingTimes")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(availableSlots ?? []).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setSelectedTime(t);
                            setBookingStep(4);
                          }}
                          className={`text-sm px-3 py-2 rounded-lg border transition ${
                            selectedTime === t
                              ? "border-celeste-dark bg-celeste-50 text-celeste-dark font-semibold"
                              : "border-border-light hover:border-celeste-200 text-ink-500"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                      {(availableSlots ?? []).length === 0 && !slotsLoading && (
                        <p className="col-span-full text-sm text-ink-muted text-center py-4">
                          {t("patient.noTimesAvailable")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Confirm */}
              {bookingStep === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-ink-muted">{t("patient.confirmAppointment")}</p>

                  {/* Doctor picker */}
                  {filteredDoctors.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-ink-muted">
                        {t("patient.professionalOptional")}
                      </label>
                      <select
                        value={selectedDoctorId ?? ""}
                        onChange={(e) => setSelectedDoctorId(e.target.value || undefined)}
                        className="w-full border border-border-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-celeste-200 focus:border-celeste-dark bg-white"
                      >
                        <option value="">{t("patient.toBeAssigned")}</option>
                        {filteredDoctors.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} — {doc.location}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Appointment type */}
                  <div className="flex gap-2">
                    {(["presencial", "teleconsulta"] as const).map((tp) => (
                      <button
                        key={tp}
                        onClick={() => setBookingType(tp)}
                        className={`flex-1 text-sm px-3 py-2 rounded-xl border transition ${
                          bookingType === tp
                            ? "border-celeste-dark bg-celeste-50 text-celeste-dark font-semibold"
                            : "border-border-light text-ink-muted hover:border-celeste-200"
                        }`}
                      >
                        {tp === "presencial"
                          ? t("patient.inPerson")
                          : t("patient.teleconsultaType")}
                      </button>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="bg-surface rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">{t("patient.specialty")}</span>
                      <span className="font-semibold text-ink">{selectedSpecialty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">{t("patient.dateLabel")}</span>
                      <span className="font-semibold text-ink">
                        {new Date(selectedDate + "T12:00").toLocaleDateString(
                          locale === "en" ? "en-US" : "es-AR",
                          {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">{t("patient.timeLabel")}</span>
                      <span className="font-semibold text-ink">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">{t("patient.modality")}</span>
                      <span className="font-semibold text-ink">
                        {bookingType === "teleconsulta"
                          ? t("patient.teleconsultaType")
                          : t("patient.inPerson")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">{t("patient.professional")}</span>
                      <span className="font-semibold text-ink">
                        {selectedDoctorId
                          ? (filteredDoctors.find((d) => d.id === selectedDoctorId)?.name ??
                            t("patient.toBeAssigned"))
                          : t("patient.toBeAssigned")}
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        const result = await doCreateBooking({
                          specialty: selectedSpecialty,
                          date: selectedDate,
                          time: selectedTime,
                          type: bookingType,
                          doctorId: selectedDoctorId,
                        });
                        // Optimistic local update
                        setLocalAppointments((prev) => [result, ...prev]);

                        // If a payment URL was returned, redirect to MercadoPago
                        if (result.paymentUrl) {
                          showToast(t("patient.redirectingToPayment"));
                          resetBooking();
                          router.push(`/paciente/pagos?bookingId=${result.id}`);
                          return;
                        }

                        showToast(t("patient.appointmentConfirmed"));
                        resetBooking();
                      } catch {
                        showToast(t("patient.appointmentError"));
                        setIsSubmitting(false);
                      }
                    }}
                    className="w-full bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold py-3 rounded-[4px] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? t("patient.confirming") : t("patient.confirmBooking")}
                  </button>
                </div>
              )}
            </div>

            {/* Back button */}
            {bookingStep > 1 && (
              <div className="px-6 pb-4">
                <button
                  onClick={() => setBookingStep(bookingStep - 1)}
                  className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {t("patient.back")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Reschedule modal ──────────────────────────────── */}
      {rescheduleApt && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setRescheduleApt(null)}
          onKeyDown={(e) => e.key === "Escape" && setRescheduleApt(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("patient.rescheduleTitle")}
            className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <h2 className="text-lg font-bold text-ink">{t("patient.rescheduleTitle")}</h2>
              <button
                onClick={() => setRescheduleApt(null)}
                aria-label={t("patient.closeModal")}
                className="p-1 text-ink-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Doctor info (read-only) */}
              <div className="bg-surface rounded-xl p-3">
                <p className="text-sm font-semibold text-ink">{rescheduleApt.doctor}</p>
                <p className="text-xs text-ink-muted">{rescheduleApt.specialty}</p>
              </div>
              {/* New date */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">
                  {t("patient.newDate")}
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setRescheduleTime("");
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-celeste-200 focus:border-celeste-dark"
                />
              </div>
              {/* Time slots */}
              {rescheduleDate && (
                <div>
                  <label className="text-xs font-medium text-ink-muted block mb-1">
                    {t("patient.newTime")}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      "08:00",
                      "08:30",
                      "09:00",
                      "09:30",
                      "10:00",
                      "10:30",
                      "11:00",
                      "11:30",
                      "14:00",
                      "14:30",
                      "15:00",
                      "15:30",
                      "16:00",
                      "16:30",
                      "17:00",
                      "17:30",
                    ].map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setRescheduleTime(slot)}
                        className={`text-xs px-2 py-2 rounded-lg border transition ${
                          rescheduleTime === slot
                            ? "border-celeste-dark bg-celeste-50 text-celeste-dark font-semibold"
                            : "border-border-light hover:border-celeste-200 text-ink-500"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                disabled={!rescheduleDate || !rescheduleTime || isRescheduling}
                onClick={handleReschedule}
                className="w-full bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold py-3 rounded-[4px] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRescheduling && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("patient.confirmReschedule")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

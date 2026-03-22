"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  MapPin,
  Star,
  Calendar,
  Clock,
  Video,
  Phone,
  Filter,
  Heart,
  ChevronDown,
  User,
  Award,
  Building,
  ExternalLink,
  Navigation,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { getGoogleMapsSearchUrl } from "@/lib/doctor-search";
import { useGeolocation, type GeoCoords } from "@/lib/hooks/useGeolocation";
import { useLocale } from "@/lib/i18n/context";
import { useDoctorDirectory } from "@/hooks/use-patient-data";
import type { PatientDoctor } from "@/lib/services/patient-data";
import RideChatbot from "@/components/RideChatbot";
import RideQuickLinks from "@/components/RideQuickLinks";

/* ── types ────────────────────────────────────────────── */
type Doctor = PatientDoctor;

/* ── haversine distance helper ────────────────────────── */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/* ── Doctor avatar with photo or fallback initials ─────── */
function DoctorAvatar({ doctor, size = 56 }: { doctor: Doctor; size?: number }) {
  const initials = doctor.name
    .split(" ")
    .slice(1)
    .map((n) => n[0])
    .join("");

  if (doctor.photoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={doctor.photoUrl}
        alt={doctor.name}
        width={size}
        height={size}
        className="rounded-2xl object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => {
          // Fallback to initials on load error
          const el = e.currentTarget;
          el.style.display = "none";
          el.parentElement?.querySelector(".avatar-fallback")?.classList.remove("hidden");
        }}
      />
    );
  }

  return (
    <div
      className="rounded-2xl bg-celeste-50 flex items-center justify-center shrink-0 font-bold text-celeste-dark"
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {initials || (
        <User className="text-celeste-dark" style={{ width: size * 0.5, height: size * 0.5 }} />
      )}
    </div>
  );
}

/* ── demo data removed — using SWR hooks ──────────────── */

const specialties = [
  "Todas",
  "Clínica Médica",
  "Cardiología",
  "Dermatología",
  "Ginecología",
  "Traumatología",
  "Pediatría",
];
const locations = ["Todas", "Belgrano", "Palermo", "Recoleta", "Microcentro", "Caballito"];

export default function MedicosPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const { t, locale } = useLocale();
  const { data: doctors } = useDoctorDirectory();
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("Todas");
  const [location, setLocation] = useState("Todas");
  const [teleconsultaOnly, setTeleconsultaOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatDoctor, setChatDoctor] = useState<Doctor | null>(null);
  const geo = useGeolocation({ lazy: true });

  // Compute distances when geolocation is available
  const allDoctors = doctors ?? [];
  const doctorsWithDistance = allDoctors.map((d) => ({
    ...d,
    distanceKm: geo.coords
      ? Math.round(haversineKm(geo.coords.latitude, geo.coords.longitude, d.lat, d.lng) * 10) / 10
      : (null as number | null),
  }));

  const filtered = doctorsWithDistance
    .filter((d) => {
      if (
        search &&
        !d.name.toLowerCase().includes(search.toLowerCase()) &&
        !d.specialty.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (specialty !== "Todas" && d.specialty !== specialty) return false;
      if (location !== "Todas" && d.location !== location) return false;
      if (teleconsultaOnly && !d.teleconsulta) return false;
      if (availableOnly && !d.availableToday) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortByDistance && a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">{t("patient.searchDoctor")}</h1>
        <p className="text-sm text-ink-muted mt-0.5">{t("patient.searchDoctorSubtitle")}</p>
      </div>

      {/* Search & filters */}
      <div className="bg-white rounded-2xl border border-border-light p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            type="text"
            placeholder={t("patient.searchByNameOrSpecialty")}
            aria-label={t("patient.searchByNameOrSpecialty")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-celeste-200 focus:border-celeste-dark"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            title={t("patient.filterBySpecialty")}
            className="border border-border-light rounded-lg px-3 py-1.5 text-sm text-ink-500 focus:outline-none focus:ring-2 focus:ring-celeste-200"
          >
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            title={t("patient.filterByZone")}
            className="border border-border-light rounded-lg px-3 py-1.5 text-sm text-ink-500 focus:outline-none focus:ring-2 focus:ring-celeste-200"
          >
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-ink-500 cursor-pointer">
            <input
              type="checkbox"
              checked={teleconsultaOnly}
              onChange={(e) => setTeleconsultaOnly(e.target.checked)}
              className="rounded border-border-light text-celeste-dark focus:ring-celeste-200"
            />
            {t("patient.teleconsultaType")}
          </label>
          <label className="flex items-center gap-1.5 text-xs text-ink-500 cursor-pointer">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded border-border-light text-celeste-dark focus:ring-celeste-200"
            />
            {t("patient.availableTodayLabel")}
          </label>
          {/* Geolocation sort toggle */}
          {!geo.coords && !geo.loading && (
            <button
              onClick={() => {
                geo.refresh();
                setSortByDistance(true);
              }}
              className="flex items-center gap-1.5 text-xs text-celeste-dark hover:underline font-medium ml-1"
              title="Ordenar por cercanía"
            >
              <Navigation className="w-3 h-3" />
              {t("patient.nearMe")}
            </button>
          )}
          {geo.loading && (
            <span className="flex items-center gap-1.5 text-xs text-ink-muted ml-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t("patient.locating")}
            </span>
          )}
          {geo.coords && (
            <label className="flex items-center gap-1.5 text-xs text-ink-500 cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={sortByDistance}
                onChange={(e) => setSortByDistance(e.target.checked)}
                className="rounded border-border-light text-celeste-dark focus:ring-celeste-200"
              />
              <Navigation className="w-3 h-3 text-celeste-dark" />
              {t("patient.closest")}
            </label>
          )}
          <span className="text-xs text-ink-muted ml-auto">
            {filtered.length} {t("patient.professionals")}
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filtered.map((doctor) => (
          <div
            key={doctor.id}
            className="bg-white rounded-2xl border border-border-light p-5 hover:shadow-md transition"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Avatar */}
              <DoctorAvatar doctor={doctor} size={56} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-ink">{doctor.name}</h3>
                    <p className="text-sm text-ink-muted">
                      {doctor.specialty}
                      {doctor.subspecialty && (
                        <span className="text-ink-300"> · {doctor.subspecialty}</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => showToast(`${doctor.name} ${t("patient.addedToFavorites")}`)}
                    className="p-2 text-ink-200 hover:text-red-500 transition shrink-0"
                    aria-label={`${t("patient.addToFavorites")} ${doctor.name}`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    <span className="font-semibold text-ink">{doctor.rating}</span>({doctor.reviews}{" "}
                    {t("patient.opinions")})
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {doctor.location}
                  </span>
                  {doctor.distanceKm != null && (
                    <span className="flex items-center gap-1 text-celeste-dark font-medium">
                      <Navigation className="w-3 h-3" />
                      {formatDistance(doctor.distanceKm)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {doctor.education}
                  </span>
                  <a
                    href={getGoogleMapsSearchUrl(doctor.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-celeste-dark hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Google Maps
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {doctor.teleconsulta && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-success-50 text-success-700 px-2 py-0.5 rounded-full">
                      <Video className="w-3 h-3" /> Teleconsulta
                    </span>
                  )}
                  {doctor.availableToday && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-celeste-50 text-celeste-dark px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> {t("patient.availableTodayLabel")}
                    </span>
                  )}
                  {doctor.insurance.slice(0, 3).map((ins) => (
                    <span
                      key={ins}
                      className="text-[11px] bg-ink-50 text-ink-400 px-2 py-0.5 rounded-full"
                    >
                      {ins}
                    </span>
                  ))}
                </div>

                <div className="mt-2">
                  <RideQuickLinks name={doctor.name} address={doctor.address} />
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-ink-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t("patient.nextSlot")}{" "}
                    <span className="font-semibold text-celeste-dark">{doctor.nextSlot}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-border-light">
              <button
                onClick={() => setSelectedDoctor(doctor)}
                className="flex-1 text-sm font-medium text-celeste-dark bg-celeste-50 hover:bg-celeste-100 py-2 rounded-[4px] transition"
              >
                {t("patient.viewProfile")}
              </button>
              <button
                onClick={() => router.push("/paciente/turnos")}
                className="flex-1 text-sm font-semibold text-white bg-celeste-dark hover:bg-celeste-700 py-2 rounded-[4px] transition text-center"
              >
                {t("patient.bookAppointmentAction")}
              </button>
              {doctor.teleconsulta && (
                <button
                  onClick={() => router.push("/paciente/teleconsulta")}
                  className="text-sm font-medium text-success-700 bg-success-50 hover:bg-success-100 px-4 py-2 rounded-[4px] transition flex items-center gap-1"
                >
                  <Video className="w-3.5 h-3.5" />
                  Virtual
                </button>
              )}
              <button
                onClick={() => {
                  setChatDoctor(doctor);
                  setShowChat(true);
                }}
                className="text-sm font-medium text-celeste-dark bg-celeste-50 hover:bg-celeste-100 px-4 py-2 rounded-[4px] transition flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                Transporte
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-border-light px-5 py-12 text-center text-sm text-ink-muted">
            No se encontraron profesionales con esos filtros
          </div>
        )}
      </div>

      {/* Doctor detail modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <DoctorAvatar doctor={selectedDoctor} size={64} />
                <div>
                  <h2 className="text-lg font-bold text-ink">{selectedDoctor.name}</h2>
                  <p className="text-sm text-ink-muted">{selectedDoctor.specialty}</p>
                  {selectedDoctor.subspecialty && (
                    <p className="text-xs text-ink-300">{selectedDoctor.subspecialty}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-ink-muted">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  <span className="font-semibold text-ink">{selectedDoctor.rating}</span> —{" "}
                  {selectedDoctor.reviews} opiniones
                </div>
                <div className="flex items-start gap-2 text-ink-muted">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  {selectedDoctor.address}
                </div>
                <div className="flex items-center gap-2 text-ink-muted">
                  <Award className="w-4 h-4 shrink-0" />
                  {selectedDoctor.education}
                </div>
                <div className="flex items-start gap-2 text-ink-muted">
                  <Building className="w-4 h-4 mt-0.5 shrink-0" />
                  Obras sociales: {selectedDoctor.insurance.join(", ")}
                </div>
                <a
                  href={getGoogleMapsSearchUrl(selectedDoctor.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-celeste-dark hover:underline text-sm"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  Ver ubicación en Google Maps
                </a>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="flex-1 border border-border-light text-ink-500 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setSelectedDoctor(null);
                    router.push("/paciente/turnos");
                  }}
                  className="flex-1 bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold py-2.5 rounded-[4px] transition text-center"
                >
                  Sacar turno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Ride Chatbot modal ─────────────────────────── */}
      {showChat && chatDoctor && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowChat(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowChat(false)}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl h-[70vh] flex flex-col overflow-hidden">
            <RideChatbot
              preloadContext={{
                doctorName: chatDoctor.name,
                address: chatDoctor.address,
                destLat: chatDoctor.lat,
                destLng: chatDoctor.lng,
                specialty: chatDoctor.specialty,
              }}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

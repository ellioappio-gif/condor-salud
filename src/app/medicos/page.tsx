import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { searchPublicDoctors, getSpecialties, getCities } from "@/lib/services/doctor-profiles";
import type { DoctorPublicProfile } from "@/lib/types";
import { Search, MapPin, Star, BadgeCheck, Video, ChevronRight, Stethoscope } from "lucide-react";

// ─── Metadata ────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Médicos – Directorio de Profesionales de Salud | Cóndor Salud",
  description:
    "Encontrá médicos verificados en Argentina. Especialidades, teleconsulta, opiniones de pacientes. Buscá por especialidad, ciudad u obra social.",
  openGraph: {
    title: "Directorio Médico | Cóndor Salud",
    description: "Médicos verificados en Argentina. Buscá por especialidad, ciudad u obra social.",
    url: "https://condorsalud.com/medicos",
    siteName: "Cóndor Salud",
    type: "website",
  },
  alternates: { canonical: "https://condorsalud.com/medicos" },
};

// ─── Demo Data ───────────────────────────────────────────────

const DEMO_DOCTORS: DoctorPublicProfile[] = [
  {
    id: "demo-1",
    profileId: "d1",
    slug: "maria-gonzalez-cardiologia",
    displayName: "Dra. María González",
    specialty: "Cardiología",
    subSpecialties: ["Ecocardiografía", "Hipertensión"],
    bioEs: "Cardióloga con 15 años de experiencia. Especialista en hipertensión y ecocardiografía.",
    isVerified: true,
    city: "Buenos Aires",
    province: "CABA",
    insuranceAccepted: ["OSDE", "Swiss Medical", "Galeno"],
    languages: ["es", "en"],
    education: [{ institution: "UBA", degree: "Medicina", year: 2008 }],
    experienceYears: 15,
    teleconsultaAvailable: true,
    consultationFeeArs: 15000,
    published: true,
    featured: true,
    avgRating: 4.8,
    reviewCount: 42,
  },
  {
    id: "demo-2",
    profileId: "d2",
    slug: "juan-perez-traumatologia",
    displayName: "Dr. Juan Pérez",
    specialty: "Traumatología",
    subSpecialties: ["Rodilla", "Deportología"],
    bioEs: "Traumatólogo especializado en lesiones deportivas y cirugía artroscópica.",
    isVerified: true,
    city: "Córdoba",
    province: "Córdoba",
    insuranceAccepted: ["OSDE", "Medifé"],
    languages: ["es"],
    education: [{ institution: "UNC", degree: "Medicina", year: 2010 }],
    experienceYears: 12,
    teleconsultaAvailable: false,
    consultationFeeArs: 12000,
    published: true,
    featured: false,
    avgRating: 4.6,
    reviewCount: 28,
  },
  {
    id: "demo-3",
    profileId: "d3",
    slug: "laura-martinez-dermatologia",
    displayName: "Dra. Laura Martínez",
    specialty: "Dermatología",
    subSpecialties: ["Dermatología Estética", "Dermatoscopía"],
    bioEs:
      "Dermatóloga clínica y estética. Especialista en dermatoscopía digital y tratamiento de acné.",
    isVerified: true,
    city: "Rosario",
    province: "Santa Fe",
    insuranceAccepted: ["Swiss Medical", "OSDE", "Galeno", "IOMA"],
    languages: ["es", "pt"],
    education: [{ institution: "UNR", degree: "Medicina", year: 2012 }],
    experienceYears: 10,
    teleconsultaAvailable: true,
    consultationFeeArs: 18000,
    consultationFeeUsd: 45,
    published: true,
    featured: true,
    avgRating: 4.9,
    reviewCount: 67,
  },
];

const DEMO_SPECIALTIES = [
  "Cardiología",
  "Traumatología",
  "Dermatología",
  "Pediatría",
  "Ginecología",
];
const DEMO_CITIES = ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Tucumán"];

// ─── Page Component ──────────────────────────────────────────

export default async function MedicosPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; city?: string; page?: string }>;
}) {
  const params = await searchParams;
  let doctors: DoctorPublicProfile[] = DEMO_DOCTORS;
  let total = DEMO_DOCTORS.length;
  let specialties = DEMO_SPECIALTIES;
  let cities = DEMO_CITIES;

  try {
    const page = parseInt(params.page || "1") - 1;
    const [result, specs, cits] = await Promise.all([
      searchPublicDoctors({
        specialty: params.specialty,
        city: params.city,
        limit: 20,
        offset: page * 20,
      }),
      getSpecialties(),
      getCities(),
    ]);

    if (result.doctors.length > 0) {
      doctors = result.doctors;
      total = result.total;
    }
    if (specs.length > 0) specialties = specs;
    if (cits.length > 0) cities = cits;
  } catch {
    // Use demo data
  }

  // ─── JSON-LD: MedicalBusiness / ItemList ────────────────

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Directorio Médico – Cóndor Salud",
    description: "Médicos verificados en Argentina",
    numberOfItems: total,
    itemListElement: doctors.map((doc, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Physician",
        name: doc.displayName,
        medicalSpecialty: doc.specialty,
        url: `https://condorsalud.com/medicos/${doc.slug}`,
        ...(doc.city ? { address: { "@type": "PostalAddress", addressLocality: doc.city } } : {}),
        ...(doc.avgRating
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: doc.avgRating,
                reviewCount: doc.reviewCount,
              },
            }
          : {}),
      },
    })),
  };

  return (
    <main className="min-h-screen bg-gray-50" role="main" aria-label="Directorio Médico">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-celeste/10 via-white to-gold/5 py-16">
        <div className="max-w-[960px] mx-auto px-6 text-center">
          <p className="text-[11px] font-bold tracking-[2px] text-celeste uppercase mb-3">
            Directorio Médico
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-ink font-serif">
            Encontrá tu Médico Ideal
          </h1>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Profesionales verificados con opiniones reales de pacientes. Buscá por especialidad,
            ciudad u obra social.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-[960px] mx-auto px-6 -mt-6">
        <form
          className="bg-white rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-3"
          role="search"
          aria-label="Filtrar médicos"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" aria-hidden="true" />
            <select
              name="specialty"
              defaultValue={params.specialty || ""}
              className="w-full pl-10 pr-4 py-3 border rounded-lg bg-white"
              aria-label="Especialidad"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              name="city"
              defaultValue={params.city || ""}
              className="w-full pl-10 pr-4 py-3 border rounded-lg bg-white"
            >
              <option value="">Todas las ciudades</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-celeste text-white font-bold px-8 py-3 rounded-lg hover:bg-celeste-dark transition"
          >
            Buscar
          </button>
        </form>
      </section>

      {/* Results */}
      <section className="max-w-[960px] mx-auto px-6 py-10">
        <p className="text-sm text-gray-500 mb-6">
          {total} profesional{total !== 1 ? "es" : ""} encontrado{total !== 1 ? "s" : ""}
        </p>

        <div className="grid gap-4">
          {doctors.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
        </div>

        {doctors.length === 0 && (
          <div className="text-center py-20">
            <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron profesionales con esos filtros.</p>
          </div>
        )}
      </section>
    </main>
  );
}

// ─── Doctor Card ─────────────────────────────────────────────

function DoctorCard({ doctor }: { doctor: DoctorPublicProfile }) {
  return (
    <Link
      href={`/medicos/${doctor.slug}`}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-5 group"
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-celeste/10 flex items-center justify-center flex-shrink-0">
          {doctor.photoUrl ? (
            <Image
              src={doctor.photoUrl}
              alt={doctor.displayName}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <Stethoscope className="w-7 h-7 text-celeste" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-ink group-hover:text-celeste transition">
              {doctor.displayName}
            </h2>
            {doctor.isVerified && <BadgeCheck className="w-5 h-5 text-celeste flex-shrink-0" />}
            {doctor.featured && (
              <span className="text-[10px] font-bold bg-gold/20 text-gold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Destacado
              </span>
            )}
          </div>

          <p className="text-sm text-celeste-dark font-medium">{doctor.specialty}</p>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
            {doctor.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {doctor.city}
              </span>
            )}
            {doctor.avgRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                {doctor.avgRating.toFixed(1)} ({doctor.reviewCount})
              </span>
            )}
            {doctor.teleconsultaAvailable && (
              <span className="flex items-center gap-1 text-green-600">
                <Video className="w-3.5 h-3.5" />
                Teleconsulta
              </span>
            )}
          </div>

          {doctor.insuranceAccepted && doctor.insuranceAccepted.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {doctor.insuranceAccepted.slice(0, 4).map((ins) => (
                <span
                  key={ins}
                  className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                >
                  {ins}
                </span>
              ))}
              {doctor.insuranceAccepted.length > 4 && (
                <span className="text-[11px] text-gray-400">
                  +{doctor.insuranceAccepted.length - 4} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-celeste transition self-center" />
      </div>
    </Link>
  );
}

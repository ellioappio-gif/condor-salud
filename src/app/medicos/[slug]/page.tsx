import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProfileBySlug, getAllSlugs, getApprovedReviews } from "@/lib/services/doctor-profiles";
import type { DoctorPublicProfile, DoctorPublicReview } from "@/lib/types";
import {
  BadgeCheck,
  Star,
  MapPin,
  Phone,
  Mail,
  Video,
  Calendar,
  GraduationCap,
  Languages,
  Shield,
  Clock,
  ExternalLink,
  ChevronLeft,
  MessageCircle,
} from "lucide-react";

// ─── Demo Data ───────────────────────────────────────────────

const DEMO_PROFILE: DoctorPublicProfile = {
  id: "demo-1",
  profileId: "d1",
  slug: "maria-gonzalez-cardiologia",
  displayName: "Dra. María González",
  specialty: "Cardiología",
  subSpecialties: ["Ecocardiografía", "Hipertensión Arterial", "Insuficiencia Cardíaca"],
  bioEs:
    "Cardióloga con más de 15 años de experiencia en diagnóstico y tratamiento de enfermedades cardiovasculares. Especialista en ecocardiografía doppler y manejo integral de la hipertensión arterial. Miembro de la Sociedad Argentina de Cardiología.",
  bioEn:
    "Cardiologist with 15+ years of experience. Specialist in echocardiography and hypertension management. Member of the Argentine Society of Cardiology.",
  photoUrl: undefined,
  matriculaNacional: "MN 12345",
  matriculaProvincial: "MP 6789",
  isVerified: true,
  phone: "+5411 4567-8901",
  whatsapp: "5491145678901",
  email: "consultas@draganzalez.com",
  bookingUrl: "https://condorsalud.com",
  address: "Av. Santa Fe 1234, Piso 4°B",
  city: "Buenos Aires",
  province: "CABA",
  insuranceAccepted: ["OSDE", "Swiss Medical", "Galeno", "Medifé", "IOMA", "OSECAC"],
  languages: ["es", "en"],
  education: [
    { institution: "Universidad de Buenos Aires (UBA)", degree: "Medicina", year: 2008 },
    { institution: "Hospital Italiano", degree: "Residencia en Cardiología", year: 2012 },
    { institution: "Cleveland Clinic", degree: "Fellow en Ecocardiografía", year: 2014 },
  ],
  experienceYears: 15,
  teleconsultaAvailable: true,
  consultationFeeArs: 15000,
  consultationFeeUsd: 35,
  published: true,
  featured: true,
  avgRating: 4.8,
  reviewCount: 42,
};

const DEMO_REVIEWS: DoctorPublicReview[] = [
  {
    id: "r1",
    doctorProfileId: "demo-1",
    patientDisplayName: "María L.",
    rating: 5,
    title: "Excelente profesional",
    body: "Muy atenta y dedicada. Explicó todo con claridad. La recomiendo al 100%.",
    isVerifiedPatient: true,
    status: "approved",
    createdAt: "2024-11-15T10:00:00Z",
  },
  {
    id: "r2",
    doctorProfileId: "demo-1",
    patientDisplayName: "Carlos R.",
    rating: 5,
    title: "Gran experiencia",
    body: "Después de visitar varios cardiólogos, finalmente encontré una que realmente escucha.",
    isVerifiedPatient: true,
    status: "approved",
    createdAt: "2024-10-28T14:30:00Z",
  },
  {
    id: "r3",
    doctorProfileId: "demo-1",
    patientDisplayName: "Ana P.",
    rating: 4,
    title: "Muy profesional",
    body: "Consultorio impecable. Un poco de espera pero vale la pena.",
    isVerifiedPatient: false,
    status: "approved",
    createdAt: "2024-10-10T09:15:00Z",
  },
];

// ─── Static Params (ISR) ─────────────────────────────────────

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [{ slug: "maria-gonzalez-cardiologia" }];
  }
}

// ─── Metadata ────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let profile: DoctorPublicProfile | null = null;

  try {
    profile = await getProfileBySlug(slug);
  } catch {
    // fallback
  }

  if (!profile) profile = DEMO_PROFILE;

  const title = profile.seoTitle || `${profile.displayName} – ${profile.specialty} | Cóndor Salud`;
  const description =
    profile.seoDescription ||
    `${profile.displayName}, ${profile.specialty}${profile.city ? ` en ${profile.city}` : ""}. ${profile.experienceYears ? `${profile.experienceYears} años de experiencia.` : ""} Opiniones verificadas y turnos online.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://condorsalud.com/medicos/${slug}`,
      siteName: "Cóndor Salud",
      type: "profile",
      ...(profile.photoUrl ? { images: [{ url: profile.photoUrl }] } : {}),
    },
    alternates: {
      canonical: `https://condorsalud.com/medicos/${slug}`,
    },
  };
}

// ─── Page Component ──────────────────────────────────────────

export default async function DoctorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let profile: DoctorPublicProfile | null = null;
  let reviews: DoctorPublicReview[] = [];

  try {
    profile = await getProfileBySlug(slug);
    if (profile) {
      reviews = await getApprovedReviews(profile.id);
    }
  } catch {
    // Use demo
  }

  // Fallback for demo
  if (!profile) {
    if (slug === "maria-gonzalez-cardiologia") {
      profile = DEMO_PROFILE;
      reviews = DEMO_REVIEWS;
    } else {
      notFound();
    }
  }

  // ─── Schema.org JSON-LD ──────────────────────────────────

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: profile.displayName,
    medicalSpecialty: profile.specialty,
    url: `https://condorsalud.com/medicos/${slug}`,
    ...(profile.photoUrl ? { image: profile.photoUrl } : {}),
    ...(profile.bioEs ? { description: profile.bioEs } : {}),
    ...(profile.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: profile.address,
            addressLocality: profile.city,
            addressRegion: profile.province,
            addressCountry: "AR",
          },
        }
      : {}),
    ...(profile.phone ? { telephone: profile.phone } : {}),
    ...(profile.email ? { email: profile.email } : {}),
    ...(profile.teleconsultaAvailable
      ? { availableService: { "@type": "MedicalProcedure", name: "Teleconsulta" } }
      : {}),
    ...(profile.avgRating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: profile.avgRating,
            reviewCount: profile.reviewCount,
            bestRating: 5,
          },
        }
      : {}),
    ...(reviews.length > 0
      ? {
          review: reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.patientDisplayName },
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
            },
            ...(r.body ? { reviewBody: r.body } : {}),
            datePublished: r.createdAt,
          })),
        }
      : {}),
  };

  const langLabels: Record<string, string> = {
    es: "Español",
    en: "English",
    pt: "Português",
    fr: "Français",
    it: "Italiano",
    de: "Deutsch",
    zh: "中文",
  };

  return (
    <main
      className="min-h-screen bg-gray-50"
      role="main"
      aria-label={`Perfil de ${profile.displayName}`}
    >
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back link */}
      <div className="max-w-[960px] mx-auto px-6 pt-6">
        <Link
          href="/medicos"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-celeste transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al directorio
        </Link>
      </div>

      {/* Hero Card */}
      <section className="max-w-[960px] mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Top banner */}
          <div className="h-24 bg-gradient-to-r from-celeste/20 via-celeste/10 to-gold/10" />

          <div className="px-6 pb-6 -mt-12">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center flex-shrink-0">
                {profile.photoUrl ? (
                  <Image
                    src={profile.photoUrl}
                    alt={profile.displayName}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-celeste/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-celeste-dark">
                      {profile.displayName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name & Info */}
              <div className="flex-1 mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-ink font-serif">
                    {profile.displayName}
                  </h1>
                  {profile.isVerified && (
                    <span className="flex items-center gap-1 text-celeste bg-celeste/10 px-2 py-1 rounded-full text-xs font-bold">
                      <BadgeCheck className="w-4 h-4" />
                      Verificado
                    </span>
                  )}
                </div>

                <p className="text-lg text-celeste-dark font-medium mt-1">{profile.specialty}</p>

                {profile.subSpecialties && profile.subSpecialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {profile.subSpecialties.map((sub) => (
                      <span
                        key={sub}
                        className="text-xs bg-celeste/5 text-celeste-dark px-2 py-0.5 rounded-full border border-celeste/10"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick stats */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                  {profile.avgRating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      <strong>{profile.avgRating.toFixed(1)}</strong>
                      <span className="text-gray-400">({profile.reviewCount} opiniones)</span>
                    </span>
                  )}
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {profile.city}
                      {profile.province && profile.province !== profile.city
                        ? `, ${profile.province}`
                        : ""}
                    </span>
                  )}
                  {profile.experienceYears && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {profile.experienceYears} años de experiencia
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-2 md:w-56 flex-shrink-0 mt-2">
                {profile.bookingUrl && (
                  <a
                    href={profile.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-celeste text-white font-bold py-3 px-4 rounded-xl hover:bg-celeste-dark transition"
                  >
                    <Calendar className="w-5 h-5" />
                    Sacar Turno
                  </a>
                )}
                {profile.teleconsultaAvailable && (
                  <a
                    href={profile.bookingUrl || "#"}
                    className="flex items-center justify-center gap-2 bg-green-50 text-green-700 font-bold py-3 px-4 rounded-xl border border-green-200 hover:bg-green-100 transition"
                  >
                    <Video className="w-5 h-5" />
                    Teleconsulta
                  </a>
                )}
                {profile.whatsapp && (
                  <a
                    href={`https://wa.me/${profile.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-green-600 font-medium py-2 px-4 rounded-xl border border-green-200 hover:bg-green-50 transition text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="max-w-[960px] mx-auto px-6 pb-12 grid md:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Bio */}
          {profile.bioEs && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-ink mb-3">Sobre el profesional</h2>
              <p className="text-gray-600 leading-relaxed">{profile.bioEs}</p>
            </div>
          )}

          {/* Education */}
          {profile.education && profile.education.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-celeste" />
                Formación
              </h2>
              <div className="space-y-3">
                {profile.education.map((edu, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-celeste/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-celeste">{edu.year}</span>
                    </div>
                    <div>
                      <p className="font-medium text-ink">{edu.degree}</p>
                      <p className="text-sm text-gray-500">{edu.institution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-gold" />
              Opiniones de Pacientes
            </h2>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "text-gold fill-gold" : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-ink">
                        {review.patientDisplayName}
                      </span>
                      {review.isVerifiedPatient && (
                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                          Paciente verificado
                        </span>
                      )}
                    </div>
                    {review.title && <p className="font-medium text-ink mt-1">{review.title}</p>}
                    {review.body && <p className="text-sm text-gray-600 mt-1">{review.body}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(review.createdAt).toLocaleDateString("es-AR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                Aún no hay opiniones. Sé el primero en opinar.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="font-bold text-ink mb-3">Contacto</h3>
            <div className="space-y-3 text-sm">
              {profile.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{profile.address}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${profile.phone}`} className="text-celeste-dark hover:underline">
                    {profile.phone}
                  </a>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${profile.email}`} className="text-celeste-dark hover:underline">
                    {profile.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Insurance */}
          {profile.insuranceAccepted && profile.insuranceAccepted.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-celeste" />
                Obras Sociales
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.insuranceAccepted.map((ins) => (
                  <span
                    key={ins}
                    className="text-xs bg-celeste/5 text-celeste-dark px-2.5 py-1 rounded-lg border border-celeste/10"
                  >
                    {ins}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {profile.languages && profile.languages.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Languages className="w-4 h-4 text-celeste" />
                Idiomas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg"
                  >
                    {langLabels[lang] || lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fees */}
          {(profile.consultationFeeArs || profile.consultationFeeUsd) && (
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-ink mb-3">Honorarios</h3>
              <div className="space-y-1 text-sm">
                {profile.consultationFeeArs && (
                  <p className="text-gray-600">
                    Consulta:{" "}
                    <strong className="text-ink">
                      ${profile.consultationFeeArs.toLocaleString("es-AR")} ARS
                    </strong>
                  </p>
                )}
                {profile.consultationFeeUsd && (
                  <p className="text-gray-600">
                    USD: <strong className="text-ink">${profile.consultationFeeUsd} USD</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Verification Badge */}
          {profile.isVerified && (
            <div className="bg-celeste/5 rounded-xl p-5 border border-celeste/10">
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-8 h-8 text-celeste" />
                <div>
                  <p className="font-bold text-ink text-sm">Profesional Verificado</p>
                  <p className="text-xs text-gray-500">
                    Matrícula y credenciales verificadas por Cóndor Salud
                  </p>
                </div>
              </div>
              {(profile.matriculaNacional || profile.matriculaProvincial) && (
                <div className="mt-3 space-y-0.5 text-xs text-gray-500">
                  {profile.matriculaNacional && <p>{profile.matriculaNacional}</p>}
                  {profile.matriculaProvincial && <p>{profile.matriculaProvincial}</p>}
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-br from-celeste/10 to-gold/5 rounded-xl p-5 text-center">
            <p className="font-bold text-ink text-sm">¿Sos profesional de la salud?</p>
            <p className="text-xs text-gray-600 mt-1">
              Creá tu perfil verificado en Cóndor Salud y conectá con nuevos pacientes.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1 mt-3 text-celeste-dark font-bold text-sm hover:underline"
            >
              Registrate gratis
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

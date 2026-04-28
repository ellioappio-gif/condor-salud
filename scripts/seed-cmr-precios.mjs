// ─── Seed: Centro Médico Roca — Service Pricing ──────────────
// Run: node scripts/seed-cmr-precios.mjs
//
// Seeds all services with prices (and EF prices where applicable)
// for the receptionist pricing dashboard.
// ──────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key);
const CLINIC_ID = "cc7b1d0c-1150-40de-820e-7f216766cc9f";

// ─── Service definitions ─────────────────────────────────────
// { name, category, price, ef_price?, duration_min?, description?, notes? }

const SERVICES = [
  // ── Cardiología / Estudios ──────────────────────────────────
  { name: "EKG Solo", category: "estudio", price: 20000, ef_price: null, notes: null },
  { name: "Control Marcapasos", category: "estudio", price: 40000, ef_price: null, notes: "Control MP" },
  { name: "Consulta General / Clínico", category: "consulta", price: 48000, ef_price: 45000, duration_min: 20 },
  { name: "Consulta Cardio + EKG", category: "consulta", price: 65000, ef_price: 62000, duration_min: 30 },
  { name: "Consulta Cardio Subsiguiente", category: "consulta", price: 55000, ef_price: 52000, duration_min: 20 },
  { name: "Apto Físico / Riesgo Quirúrgico + EKG", category: "estudio", price: 45000, ef_price: 42000, notes: "+ Informe" },
  { name: "Ecocardiograma", category: "estudio", price: 75000, ef_price: 70000, duration_min: 30 },
  { name: "Doppler Carótida / Arterial / Venoso", category: "estudio", price: 75000, ef_price: 70000, duration_min: 30 },
  { name: "Ergometría", category: "estudio", price: 75000, ef_price: 70000, duration_min: 30 },
  { name: "Índice Braquio/Crural c/Doppler", category: "estudio", price: 75000, ef_price: 70000, duration_min: 20 },
  { name: "Eco Stress con PEG", category: "estudio", price: 180000, ef_price: 165000, duration_min: 60 },
  { name: "Eco Stress Farmacológico", category: "estudio", price: 210000, ef_price: 198000, duration_min: 60 },

  // ── Estudios por Imagen / Otros ─────────────────────────────
  { name: "Socios (Membresía)", category: "otro", price: 30000, ef_price: null, notes: "Membresía mensual" },
  { name: "Pack 4 Estudios Cardio (Socio)", category: "estudio", price: 0, ef_price: null, notes: "50% desc. para socios", description: "4 estudios de cardiología con 50% de descuento para socios" },
  { name: "Holter / MAPA 24 hrs", category: "estudio", price: 78000, ef_price: 68000, duration_min: 30, notes: "Retiro al día siguiente" },
  { name: "Tilt Test", category: "estudio", price: 165000, ef_price: 150000, duration_min: 60 },
  { name: "Ecografías", category: "estudio", price: 27000, ef_price: 25000, duration_min: 20 },
  { name: "Ecografía + Doppler", category: "estudio", price: 37000, ef_price: 35000, duration_min: 30 },
  { name: "Radiografías", category: "estudio", price: 20000, ef_price: null, notes: "+ Informe ($23.000 total)" },
  { name: "Mamografía", category: "estudio", price: 50000, ef_price: null, duration_min: 20 },
  { name: "Mamografía (Tec Club)+", category: "estudio", price: 30000, ef_price: null, notes: "Adicional técnica club" },
  { name: "Mamografía (Magnificada)+", category: "estudio", price: 30000, ef_price: null, notes: "Adicional magnificada" },
  { name: "Kinesiología", category: "rehabilitacion", price: 35000, ef_price: null, duration_min: 40 },
  { name: "PAP + Colposcopía + Consulta", category: "consulta", price: 85000, ef_price: null, duration_min: 30 },
  { name: "PAP + Cepillado", category: "estudio", price: 45000, ef_price: null, duration_min: 20 },

  // ── Especialistas (Sin Descuento) ───────────────────────────
  { name: "Consulta Infectología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Sin desc." },
  { name: "Consulta Maxilofacial", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Sin desc." },
  { name: "Consulta Terapia Alternativa", category: "consulta", price: 60000, ef_price: null, duration_min: 30, notes: "Sin desc." },
  { name: "Consulta Oftalmología", category: "consulta", price: 50000, ef_price: null, duration_min: 20, notes: "Sin desc. (4 años)" },
  { name: "Consulta Hematología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Sin desc." },
  { name: "Consulta Neumonología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Sin desc." },
  { name: "Consulta Urología", category: "consulta", price: 50000, ef_price: null, duration_min: 20, notes: "Sin desc." },
  { name: "Consulta Reumatología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Sin desc." },
  { name: "Consulta Neurología", category: "consulta", price: 50000, ef_price: null, duration_min: 20, notes: "Sin desc." },
  { name: "Consulta Cirugía General", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Sin desc." },
  { name: "Fondo de Ojos", category: "estudio", price: 45000, ef_price: null, duration_min: 15 },
  { name: "Consulta Odontología", category: "consulta", price: 30000, ef_price: null, duration_min: 30 },

  // ── Prácticas / Otros ───────────────────────────────────────
  { name: "Apto Físico", category: "estudio", price: 45000, ef_price: null, notes: "Apto general" },
  { name: "Nebulización", category: "otro", price: 15000, ef_price: null, duration_min: 15 },
  { name: "Aplicación Inyectable (Insumo Paciente)", category: "otro", price: 5000, ef_price: null, duration_min: 10, notes: "Paciente trae insumo" },
  { name: "Espirometría Simple", category: "estudio", price: 55000, ef_price: 52000, duration_min: 20 },
  { name: "Espirometría con Broncodilatador", category: "estudio", price: 65000, ef_price: 62000, duration_min: 30 },

  // ── Especialidades faltantes ────────────────────────────────
  // Traumatología
  { name: "Consulta Traumatología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Dr. Rivero" },

  // Endocrinología / Diabetología
  { name: "Consulta Endocrinología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Dra. Angelotti — quincenal" },
  { name: "Consulta Diabetología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Dra. Gutiérrez" },

  // Dermatología
  { name: "Consulta Dermatología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Dra. Jiménez — quincenal" },

  // Gastroenterología
  { name: "Consulta Gastroenterología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Dra. Abdala" },
  { name: "Videocolonoscopía", category: "estudio", price: 180000, ef_price: 165000, duration_min: 60, notes: "Con sedación" },
  { name: "Videoendoscopía Digestiva Alta", category: "estudio", price: 150000, ef_price: 138000, duration_min: 45, notes: "Con sedación" },

  // Ginecología
  { name: "Consulta Ginecología", category: "consulta", price: 55000, ef_price: null, duration_min: 20, notes: "Dr. Diccea / Dra. Parraga" },
  { name: "Colocación DIU", category: "procedimiento", price: 80000, ef_price: null, duration_min: 30 },
  { name: "Extracción DIU", category: "procedimiento", price: 50000, ef_price: null, duration_min: 20 },

  // Otorrinolaringología
  { name: "Consulta Otorrinolaringología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Dra. Castro — por fecha" },
  { name: "Audiometría", category: "estudio", price: 45000, ef_price: null, duration_min: 20 },
  { name: "Impedanciometría", category: "estudio", price: 40000, ef_price: null, duration_min: 15 },

  // Psicología
  { name: "Consulta Psicología", category: "consulta", price: 55000, ef_price: null, duration_min: 50, notes: "Lic. Molina" },

  // Fonoaudiología
  { name: "Consulta Fonoaudiología", category: "consulta", price: 55000, ef_price: null, duration_min: 40, notes: "Lic. Safar — mensual" },

  // Alergología
  { name: "Consulta Alergología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Dra. Urbieta — quincenal" },
  { name: "Test Cutáneo Alérgico", category: "estudio", price: 45000, ef_price: null, duration_min: 30 },

  // Flebología
  { name: "Consulta Flebología", category: "consulta", price: 60000, ef_price: null, duration_min: 20, notes: "Dr. Lagos" },
  { name: "Escleroterapia (por sesión)", category: "procedimiento", price: 70000, ef_price: null, duration_min: 30 },
  { name: "Eco-Doppler Venoso Miembros Inferiores", category: "estudio", price: 75000, ef_price: 70000, duration_min: 30 },

  // Nutrición
  { name: "Consulta Nutrición", category: "consulta", price: 50000, ef_price: null, duration_min: 30, notes: "Lunes con turno" },

  // Laboratorio
  { name: "Laboratorio — Hemograma Completo", category: "laboratorio", price: 15000, ef_price: null, duration_min: 10 },
  { name: "Laboratorio — Glucemia", category: "laboratorio", price: 8000, ef_price: null, duration_min: 5 },
  { name: "Laboratorio — Lipidograma Completo", category: "laboratorio", price: 20000, ef_price: null, duration_min: 10 },
  { name: "Laboratorio — TSH / T4", category: "laboratorio", price: 18000, ef_price: null, duration_min: 10 },
  { name: "Laboratorio — Orina Completa", category: "laboratorio", price: 10000, ef_price: null, duration_min: 5 },
  { name: "Laboratorio — Coagulograma", category: "laboratorio", price: 15000, ef_price: null, duration_min: 10 },
  { name: "Laboratorio — Hepatograma", category: "laboratorio", price: 18000, ef_price: null, duration_min: 10 },
  { name: "Laboratorio — Perfil Renal (Urea/Creatinina)", category: "laboratorio", price: 15000, ef_price: null, duration_min: 10 },
  { name: "Laboratorio — Pack Chequeo Completo", category: "laboratorio", price: 65000, ef_price: 58000, duration_min: 15, description: "Hemograma + glucemia + lipidograma + hepatograma + renal + orina" },

  // Cirugía Dental (Dr. Vargas Freddy)
  { name: "Consulta Cirugía Dental", category: "consulta", price: 50000, ef_price: null, duration_min: 30, notes: "Dr. Vargas Freddy — Lunes" },
  { name: "Extracción Dental Simple", category: "procedimiento", price: 60000, ef_price: null, duration_min: 30 },
  { name: "Extracción Muela de Juicio", category: "procedimiento", price: 120000, ef_price: null, duration_min: 60 },

  // Odontología Pediátrica
  { name: "Consulta Odontología Pediátrica", category: "consulta", price: 35000, ef_price: null, duration_min: 30, notes: "Ver disponibilidad" },

  // Radiografía (Téc. Heit)
  { name: "Radiografía + Informe", category: "estudio", price: 23000, ef_price: null, duration_min: 15, notes: "Téc. Heit — incluye informe" },
  { name: "Radiografía Panorámica Dental", category: "estudio", price: 28000, ef_price: null, duration_min: 10 },

  // Chequeos / Packs preventivos
  { name: "Chequeo Ejecutivo Completo", category: "otro", price: 250000, ef_price: 220000, duration_min: 120, description: "Clínico + ECG + laboratorio completo + ecografía abdominal + RX tórax" },
  { name: "Chequeo Cardiológico Completo", category: "otro", price: 180000, ef_price: 165000, duration_min: 90, description: "Consulta cardio + ECG + Ecocardiograma + Ergometría" },
];

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log("💰 Seeding CMR service pricing...\n");

  // 1. Columns already exist from migration 023 — skip rpc call

  // 2. Clear existing services for this clinic (fresh seed)
  const { error: delErr } = await sb
    .from("clinic_services")
    .delete()
    .eq("clinic_id", CLINIC_ID);
  if (delErr) {
    console.error("❌ Error clearing old services:", delErr.message);
  } else {
    console.log("🗑️  Cleared existing services");
  }

  // 3. Insert all services
  const rows = SERVICES.map((s) => ({
    clinic_id: CLINIC_ID,
    name: s.name,
    description: s.description || null,
    category: s.category,
    price: s.price,
    ef_price: s.ef_price || null,
    currency: "ARS",
    duration_min: s.duration_min || null,
    notes: s.notes || null,
    active: true,
  }));

  const { data, error } = await sb
    .from("clinic_services")
    .insert(rows)
    .select("id, name");

  if (error) {
    console.error("❌ Insert error:", error.message);
    process.exit(1);
  }

  console.log(`\n✅ Seeded ${data.length} services:\n`);
  for (const svc of data) {
    console.log(`   • ${svc.name}`);
  }

  console.log("\n🎉 CMR pricing seeded successfully!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

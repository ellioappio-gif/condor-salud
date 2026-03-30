// ─── Create doctor dashboard accounts for Centro Médico Roca ─
// Updates doctor records + creates medico auth accounts
//
// Run: node scripts/create-doctor-accounts.mjs

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const CLINIC_ID = "cc7b1d0c-1150-40de-820e-7f216766cc9f";
const DEFAULT_PASSWORD = "Rocamedico1*";

// ─── Doctor data (from latest staff update, March 30 2026) ───

const DOCTORS = [
  {
    name: "Dr. Vargas Freddy",
    specialty: "Cirugía Dental",
    matricula: null,
    phone: "+5491130763493",
    email: "vargas.freddy@centromedicoroca.com",
    schedule: [{ day: 1, start: "14:30", end: "15:30" }],
    active: true,
  },
  {
    name: "Dr. Gustavo Delgadillo",
    specialty: "Ecografía",
    matricula: "MN-157282",
    phone: "+5491170181295",
    email: "gustavo.delgadillo@centromedicoroca.com",
    schedule: [
      { day: 2, start: "10:00", end: "12:00" },
      { day: 4, start: "14:00", end: "15:45" },
    ],
    active: true,
  },
  {
    name: "Dr. Richard Rivero",
    specialty: "Traumatología",
    matricula: "MN-151338",
    phone: "+5491137050529",
    email: "richard.rivero@centromedicoroca.com",
    schedule: [{ day: 2, start: "17:00", end: "18:00" }],
    active: true,
  },
  {
    name: "Dra. Mariana Ríos",
    specialty: "Terapia Alternativa",
    matricula: "MN-13122",
    phone: "+542216925128",
    email: "mariana.rios@centromedicoroca.com",
    schedule: [], // Irregular — ella avisa cuando viene, 1 vez al mes
    notes: "Viene 1 vez al mes, ella avisa cuando viene.",
    active: true,
  },
  {
    name: "Dra. Martha Gibilbank",
    specialty: "Oftalmología",
    matricula: "MN-61235",
    phone: "+5491153247149",
    email: "martha.gibilbank@centromedicoroca.com",
    schedule: [{ day: 2, start: "15:00", end: "16:00" }],
    active: true,
  },
  {
    name: "Dr. José Asz",
    specialty: "Oftalmología",
    matricula: "MN-100366",
    phone: "+5491144201443",
    email: "jose.asz@centromedicoroca.com",
    schedule: [{ day: 5, start: "13:30", end: "14:30" }],
    active: true,
  },
  {
    name: "Dra. Norma Legal",
    specialty: "Hematología",
    matricula: "MN-113014",
    phone: "+5491130270474",
    email: "norma.legal@centromedicoroca.com",
    schedule: [
      { day: 2, start: "15:00", end: "16:00" },
      { day: 4, start: "16:00", end: "17:00" },
    ],
    active: true,
  },
  {
    name: "Dr. Rogelio Vargas Lopez",
    specialty: "Urología",
    matricula: "MN-115956",
    phone: "+5491167008079",
    email: "rogelio.vargas@centromedicoroca.com",
    schedule: [{ day: 3, start: "11:30", end: "12:30" }],
    active: true,
  },
  {
    name: "Dra. Alicia Urbieta",
    specialty: "Alergista",
    matricula: "MN-105946",
    phone: "+5491167497167",
    email: "alicia.urbieta@centromedicoroca.com",
    schedule: [{ day: 3, start: "14:00", end: "15:00" }], // c/15 días
    notes: "Cada 15 días.",
    active: true,
  },
  {
    name: "Dr. Adrián Lezcano",
    specialty: "Infectología",
    matricula: "MN-102921",
    phone: "+5491162046147",
    email: "adrian.lezcano@centromedicoroca.com",
    schedule: [{ day: 4, start: "13:00", end: "14:00" }],
    active: true,
  },
  {
    name: "Dr. Juan Manuel Dalpiaz",
    specialty: "Cirugía General",
    matricula: "MN-141225",
    phone: "+5491154922054",
    email: "juan.dalpiaz@centromedicoroca.com",
    schedule: [{ day: 4, start: "11:00", end: "12:00" }],
    active: true,
  },
  {
    name: "Dra. Liliana Angelotti",
    specialty: "Endocrinología",
    matricula: "MN-69824",
    phone: "+5491162457322",
    email: "liliana.angelotti@centromedicoroca.com",
    schedule: [{ day: 4, start: "10:00", end: "12:00" }], // c/15 días
    notes: "Cada 15 días.",
    active: true,
  },
  {
    name: "Dra. Susana Jiménez",
    specialty: "Dermatología",
    matricula: "MN-190900",
    phone: "+5491135795426",
    email: "susana.jimenez@centromedicoroca.com",
    schedule: [{ day: 4, start: "15:00", end: "16:00" }], // c/15 días
    notes: "Cada 15 días.",
    active: true,
  },
  {
    name: "Dr. Carlos Lagos",
    specialty: "Flebología",
    matricula: "MN-78443",
    phone: "+5491128684688",
    email: "carlos.lagos@centromedicoroca.com",
    schedule: [{ day: 4, start: "17:00", end: "18:00" }],
    active: true,
  },
  {
    name: "Dr. Carlos Diccea",
    specialty: "Ginecología",
    matricula: "MN-92346",
    phone: "+5491144155887",
    email: "carlos.diccea@centromedicoroca.com",
    schedule: [{ day: 5, start: "14:00", end: "15:00" }],
    active: true,
  },
  {
    name: "Dra. María del Carmen Baied",
    specialty: "Reumatología",
    matricula: "MN-90687",
    phone: "+5491161618088",
    email: "carmen.baied@centromedicoroca.com",
    schedule: [{ day: 5, start: "09:30", end: "10:30" }],
    active: true,
  },
  {
    name: "Dra. Alicia Abdala",
    specialty: "Gastroenterología",
    matricula: "MN-44522",
    phone: "+5491136635898",
    email: "alicia.abdala@centromedicoroca.com",
    schedule: [{ day: 5, start: "12:30", end: "14:00" }],
    active: true,
  },
  {
    name: "Dra. Angela María González",
    specialty: "Gastroenterología",
    matricula: "MN-138079",
    phone: "+5491140466545",
    email: "angela.gonzalez@centromedicoroca.com",
    schedule: [{ day: 1, start: "10:00", end: "12:00" }],
    active: true,
    isNew: true,
  },
  {
    name: "Lic. Oscar Molina",
    specialty: "Psicología",
    matricula: "MN-79381",
    phone: "+5491155162615",
    email: "oscar.molina@centromedicoroca.com",
    schedule: [], // confirmar nuevamente
    notes: "Confirmar nuevamente horario.",
    active: true,
  },
  {
    name: "Dr. Julián Tottereaus",
    specialty: "Neumonología",
    matricula: "MN-154122",
    phone: "+5491121721721",
    email: "julian.tottereaus@centromedicoroca.com",
    schedule: [{ day: 5, start: "15:00", end: "16:00" }], // 1 vez al mes
    notes: "Viene 1 vez al mes.",
    active: true,
  },
  {
    name: "Dra. Irene Gutiérrez",
    specialty: "Diabetología",
    matricula: "MN-64241",
    phone: "+5491144148392",
    email: "irene.gutierrez@centromedicoroca.com",
    schedule: [{ day: 5, start: "09:00", end: "10:00" }],
    active: true,
  },
  {
    name: "Dra. Yessica Taboada",
    specialty: "Odontología",
    matricula: "MN-41698",
    phone: "+5491131457352",
    email: "yessica.taboada@centromedicoroca.com",
    schedule: [{ day: 2, start: "14:00", end: "17:00" }],
    active: true,
  },
  {
    name: "Dra. Sikiu Espinoza",
    specialty: "Odontología",
    matricula: "MN-44722",
    phone: "+5491128825532",
    email: "sikiu.espinoza@centromedicoroca.com",
    schedule: [
      { day: 3, start: "14:00", end: "17:00" },
      { day: 5, start: "14:00", end: "17:00" },
    ],
    active: true,
  },
  {
    name: "Lic. Cristina Acevedo",
    specialty: "Mamografía / Kinesiología",
    matricula: null,
    phone: "+5491163246875",
    email: "cristina.acevedo@centromedicoroca.com",
    schedule: [
      { day: 2, start: "09:00", end: "12:00" },
      { day: 4, start: "09:00", end: "12:00" },
    ],
    active: true,
  },
  {
    name: "Téc. Esteban Heit",
    specialty: "Radiografía",
    matricula: null,
    phone: "+5491168576049",
    email: "esteban.heit@centromedicoroca.com",
    schedule: [
      { day: 1, start: "13:30", end: "15:00" },
      { day: 2, start: "13:30", end: "15:00" },
      { day: 3, start: "13:30", end: "15:00" },
      { day: 4, start: "13:30", end: "15:00" },
      { day: 5, start: "13:30", end: "15:00" },
    ],
    active: true,
  },
  {
    name: "Dra. Clara Nigro",
    specialty: "Neurología",
    matricula: "MN-66572",
    phone: "+5491140359715",
    email: "clara.nigro@centromedicoroca.com",
    schedule: [{ day: 1, start: "15:00", end: "16:00" }],
    active: true,
    isNew: true,
  },
  // ─── Inactive ──────────────────────────────────────────────
  {
    name: "Lic. Eugenia Safar",
    specialty: "Fonoaudiología",
    matricula: "MN-9127",
    phone: "+5491135572970",
    email: "eugenia.safar@centromedicoroca.com",
    schedule: [],
    notes: "NO viene más.",
    active: false,
  },
];

const DAY_NAMES = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log("🩺 Creating doctor dashboard accounts...\n");

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let slotsTotal = 0;

  for (const doc of DOCTORS) {
    const label = `${doc.name} (${doc.specialty})`;

    // ── 1. Upsert doctor record ──────────────────────────────
    const doctorPayload = {
      name: doc.name,
      specialty: doc.specialty,
      matricula: doc.matricula,
      phone: doc.phone,
      email: doc.email,
      clinic_id: CLINIC_ID,
      location: "Caballito, CABA",
      address: "Juan B. Ambrosetti 698, C1405BIJ, CABA",
      available: doc.active,
      active: doc.active,
      languages: ["es"],
      teleconsulta: false,
    };

    let doctorId;
    // Find by matrícula or name
    let existing = null;
    if (doc.matricula) {
      const { data } = await sb
        .from("doctors")
        .select("id")
        .eq("matricula", doc.matricula)
        .eq("clinic_id", CLINIC_ID)
        .single();
      existing = data;
    }
    if (!existing) {
      const { data } = await sb
        .from("doctors")
        .select("id")
        .eq("name", doc.name)
        .eq("clinic_id", CLINIC_ID)
        .single();
      existing = data;
    }

    if (existing) {
      await sb.from("doctors").update(doctorPayload).eq("id", existing.id);
      doctorId = existing.id;
    } else {
      const { data: newDoc, error } = await sb
        .from("doctors")
        .insert(doctorPayload)
        .select("id")
        .single();
      if (error) {
        console.error(`  ❌ ${label}: ${error.message}`);
        continue;
      }
      doctorId = newDoc.id;
    }

    // ── 2. Create auth user + profile (if active) ────────────
    if (!doc.active) {
      console.log(`  ⏸️  ${label} — INACTIVE (no account created)`);
      skipped++;
      continue;
    }

    // Check if auth user exists
    const { data: allUsers } = await sb.auth.admin.listUsers();
    const existingUser = allUsers.users.find((u) => u.email === doc.email);

    let userId;
    if (existingUser) {
      userId = existingUser.id;
      updated++;
    } else {
      const { data: newUser, error: authErr } =
        await sb.auth.admin.createUser({
          email: doc.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: doc.name,
            clinic_name: "Centro Médico Roca",
            role: "medico",
          },
        });
      if (authErr) {
        console.error(`  ❌ ${label} auth: ${authErr.message}`);
        continue;
      }
      userId = newUser.user.id;
      created++;
    }

    // Wait for trigger then overwrite profile
    await new Promise((r) => setTimeout(r, 500));

    await sb.from("profiles").upsert({
      id: userId,
      clinic_id: CLINIC_ID,
      role: "medico",
      full_name: doc.name,
      phone: doc.phone,
      especialidad: doc.specialty,
      matricula: doc.matricula,
      active: true,
    });

    // ── 3. Regenerate availability (15-min slots, 60 days) ───
    if (doc.schedule.length > 0) {
      // Clear future availability
      const today = new Date().toISOString().slice(0, 10);
      await sb
        .from("doctor_availability")
        .delete()
        .eq("doctor_id", doctorId)
        .gte("date", today);

      let docSlots = 0;
      const now = new Date();
      for (let offset = 1; offset <= 60; offset++) {
        const d = new Date(now);
        d.setDate(d.getDate() + offset);
        const dow = d.getDay(); // 0=Sun

        for (const sched of doc.schedule) {
          if (dow !== sched.day) continue;

          const [sh, sm] = sched.start.split(":").map(Number);
          const [eh, em] = sched.end.split(":").map(Number);
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;

          const rows = [];
          for (let m = startMin; m < endMin; m += 15) {
            const hh = String(Math.floor(m / 60)).padStart(2, "0");
            const mm = String(m % 60).padStart(2, "0");
            rows.push({
              doctor_id: doctorId,
              date: d.toISOString().slice(0, 10),
              time_slot: `${hh}:${mm}`,
              booked: false,
            });
          }

          if (rows.length > 0) {
            await sb.from("doctor_availability").insert(rows);
            docSlots += rows.length;
          }
        }
      }
      slotsTotal += docSlots;
    }

    const schedStr =
      doc.schedule.length > 0
        ? doc.schedule
            .map((s) => `${DAY_NAMES[s.day]} ${s.start}`)
            .join(", ")
        : "sin horario fijo";
    const notesStr = doc.notes ? ` ⚠️  ${doc.notes}` : "";
    console.log(`  ✅ ${label} — ${schedStr}${notesStr}`);
  }

  // ─── Summary ───────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("🎉 Doctor accounts complete!");
  console.log("═".repeat(60));
  console.log(`   Created:     ${created} new accounts`);
  console.log(`   Updated:     ${updated} existing`);
  console.log(`   Inactive:    ${skipped}`);
  console.log(`   Slots:       ${slotsTotal} (15-min, 60 days)`);
  console.log(`   Password:    ${DEFAULT_PASSWORD} (all)`);
  console.log(`   Login:       condorsalud.com/login`);
  console.log("═".repeat(60));
  console.log("\n📋 Login credentials:\n");
  console.log(
    "Name".padEnd(35) + "Email".padEnd(42) + "Status",
  );
  console.log("─".repeat(90));
  for (const doc of DOCTORS) {
    const status = doc.active ? "✅" : "⏸️  inactive";
    console.log(
      doc.name.padEnd(35) + doc.email.padEnd(42) + status,
    );
  }
  console.log("\n");
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});

// ─── Recreate Dr. Francisco's account + fix clinic ───────────
// Deletes old user, fixes clinic data, creates fresh account
//
// Run: node scripts/recreate-francisco-account.mjs

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const CLINIC_ID = "cc7b1d0c-1150-40de-820e-7f216766cc9f";
const OLD_USER_ID = "cbab61d8-f8ea-4b1f-9562-33181e87dc1c";

async function main() {
  console.log("🔄 Recreating Dr. Francisco's account...\n");

  // ─── 1. Delete old profile + auth user ─────────────────────
  console.log("  1. Removing old account...");
  await sb.from("profiles").delete().eq("id", OLD_USER_ID);
  const { error: delErr } = await sb.auth.admin.deleteUser(OLD_USER_ID);
  if (delErr) console.warn("     ⚠️  Delete warning:", delErr.message);
  else console.log("     ✅ Old auth user deleted");

  // Also delete the rocasaludintegral user we created earlier
  const { data: allUsers } = await sb.auth.admin.listUsers();
  const rocaUser = allUsers.users.find(
    (u) => u.email === "rocasaludintegral@gmail.com",
  );
  if (rocaUser) {
    await sb.from("profiles").delete().eq("id", rocaUser.id);
    await sb.auth.admin.deleteUser(rocaUser.id);
    console.log("     ✅ Old rocasaludintegral user also cleaned up");
  }

  // ─── 2. Fix clinic data ────────────────────────────────────
  console.log("\n  2. Updating clinic data...");
  const { error: clinicErr } = await sb
    .from("clinics")
    .update({
      name: "Centro Médico Roca",
      slug: "centro-medico-roca",
      cuit: "20-95140905-8",
      plan_tier: "plus",
      sedes: 2,
      provincia: "CABA",
      localidad: "Caballito",
      especialidad:
        "Clínico, Cardiología, Ecografía, Odontología, Traumatología, " +
        "Flebología, Urología, Oftalmología, Diabetología, Gastroenterología, " +
        "Ginecología, Alergista, Nutrición, Terapia Alternativa, Cirugía General, " +
        "Infectología, Endocrinología, Dermatología, Otorrinolaringología, " +
        "Psicología, Fonoaudiología, Neumonología, Reumatología, Cirugía Dental, " +
        "Radiografía, Hemodinamia, Mamografía, Kinesiología, Laboratorio",
      phone: "+5491127756496",
      email: "rocasaludintegral@gmail.com",
      address: "Juan B. Ambrosetti 698, C1405BIJ, CABA",
      description:
        "Centro médico de múltiples especialidades en Caballito. " +
        "Más de 27 especialidades, 30+ profesionales y 15 años de experiencia. " +
        "Precisión y calidez para tu bienestar.",
      website: "https://www.cmrocasalud.com.ar/",
      languages: ["es"],
      operating_hours: {
        lun: { open: "10:00", close: "18:00" },
        mar: { open: "09:30", close: "18:00" },
        mie: { open: "10:00", close: "18:00" },
        jue: { open: "10:00", close: "18:00" },
        vie: { open: "10:00", close: "18:00" },
      },
      lat: -34.6189,
      lng: -58.4356,
      accepts_insurance: [],
      active: true,
      demo: false,
      onboarding_complete: true,
      onboarding_completed: true,
      onboarding_step: 5,
      public_visible: true,
      booking_enabled: true,
      onboarded_at: new Date().toISOString(),
      cantidad_profesionales: 26,
    })
    .eq("id", CLINIC_ID);

  if (clinicErr) {
    console.warn("     ⚠️  Clinic update warning:", clinicErr.message);
    console.log("     Trying without demo column...");
    // Retry without demo column (in case it doesn't exist yet)
    const { error: retry } = await sb
      .from("clinics")
      .update({
        name: "Centro Médico Roca",
        slug: "centro-medico-roca",
        plan_tier: "plus",
        sedes: 2,
        localidad: "Caballito",
        especialidad:
          "Clínico, Cardiología, Ecografía, Odontología, Traumatología, " +
          "Flebología, Urología, Oftalmología, Diabetología, Gastroenterología, " +
          "Ginecología, Alergista, Nutrición, Terapia Alternativa, Cirugía General, " +
          "Infectología, Endocrinología, Dermatología, Otorrinolaringología, " +
          "Psicología, Fonoaudiología, Neumonología, Reumatología, Cirugía Dental, " +
          "Radiografía, Hemodinamia, Mamografía, Kinesiología, Laboratorio",
        phone: "+5491127756496",
        email: "rocasaludintegral@gmail.com",
        address: "Juan B. Ambrosetti 698, C1405BIJ, CABA",
        description:
          "Centro médico de múltiples especialidades en Caballito. " +
          "Más de 27 especialidades, 30+ profesionales y 15 años de experiencia.",
        website: "https://www.cmrocasalud.com.ar/",
        languages: ["es"],
        operating_hours: {
          lun: { open: "10:00", close: "18:00" },
          mar: { open: "09:30", close: "18:00" },
          mie: { open: "10:00", close: "18:00" },
          jue: { open: "10:00", close: "18:00" },
          vie: { open: "10:00", close: "18:00" },
        },
        lat: -34.6189,
        lng: -58.4356,
        active: true,
        onboarding_complete: true,
        onboarding_completed: true,
        onboarding_step: 5,
        public_visible: true,
        booking_enabled: true,
        onboarded_at: new Date().toISOString(),
        cantidad_profesionales: 26,
      })
      .eq("id", CLINIC_ID);
    if (retry) console.error("     ❌ Clinic update failed:", retry.message);
    else console.log("     ✅ Clinic updated (without demo column — run SQL to add it)");
  } else {
    console.log("     ✅ Clinic data fully updated");
  }

  // ─── 3. Create fresh auth user ─────────────────────────────
  console.log("\n  3. Creating new auth user...");
  const { data: newUser, error: authErr } = await sb.auth.admin.createUser({
    email: "flopezmd@gmail.com",
    password: "Rocamedico1*",
    email_confirm: true,
    user_metadata: {
      full_name: "Dr. Francisco Lopez",
      clinic_name: "Centro Médico Roca",
      role: "admin",
    },
  });

  if (authErr) {
    console.error("     ❌ Auth creation failed:", authErr.message);
    process.exit(1);
  }
  const userId = newUser.user.id;
  console.log("     ✅ Auth user:", userId, "(flopezmd@gmail.com)");

  // ─── 4. Wait for trigger, then fix profile ─────────────────
  // The handle_new_user() trigger will auto-create a profile
  // but it might point to a new clinic. We overwrite it.
  console.log("\n  4. Linking profile to Centro Médico Roca...");
  await new Promise((r) => setTimeout(r, 1500)); // wait for trigger

  const { error: profErr } = await sb.from("profiles").upsert({
    id: userId,
    clinic_id: CLINIC_ID,
    role: "admin",
    full_name: "Dr. Francisco Lopez",
    phone: "+5491127756496",
    especialidad: "Director Médico",
    matricula: "MN-149549",
    active: true,
  });

  if (profErr) {
    console.error("     ❌ Profile failed:", profErr.message);
  } else {
    console.log("     ✅ Profile linked to Centro Médico Roca");
  }

  // ─── 5. Clean up any orphan clinic the trigger may have created
  console.log("\n  5. Cleaning up orphan clinics...");
  const { data: orphans } = await sb
    .from("clinics")
    .select("id, name")
    .neq("id", CLINIC_ID)
    .or("name.eq.Mi Clínica,name.eq.Centro Médico Roca")
    .eq("cuit", "20-95140905-8");

  for (const orphan of orphans || []) {
    // Move any profiles pointing to orphan → real clinic
    await sb
      .from("profiles")
      .update({ clinic_id: CLINIC_ID })
      .eq("clinic_id", orphan.id);
    await sb.from("clinics").delete().eq("id", orphan.id);
    console.log("     🗑️  Deleted orphan:", orphan.name, orphan.id);
  }

  // ─── 6. Verify ─────────────────────────────────────────────
  console.log("\n  6. Verifying...");
  const { data: finalProfile } = await sb
    .from("profiles")
    .select("*, clinics(name, plan_tier, onboarding_complete, demo)")
    .eq("id", userId)
    .single();

  console.log("\n" + "═".repeat(55));
  console.log("🎉 Account recreated successfully!");
  console.log("═".repeat(55));
  console.log("   Email:       flopezmd@gmail.com");
  console.log("   Password:    Rocamedico1*");
  console.log("   User ID:     " + userId);
  console.log("   Role:        " + finalProfile?.role);
  console.log("   Clinic:      " + finalProfile?.clinics?.name);
  console.log("   Plan:        " + finalProfile?.clinics?.plan_tier);
  console.log("   Onboarded:   " + finalProfile?.clinics?.onboarding_complete);
  console.log("   Demo:        " + (finalProfile?.clinics?.demo ?? "column missing — run SQL"));
  console.log("   URL:         condorsalud.com/login");
  console.log("═".repeat(55));
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});

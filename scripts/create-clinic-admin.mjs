// ─── Create Dr. Francisco's login account ────────────────────
// Links his auth.users entry to the existing Centro Médico Roca clinic.
//
// Run: node scripts/create-clinic-admin.mjs
//
// Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Config ──────────────────────────────────────────────────
const CLINIC_CUIT = "20-95140905-8";
const ADMIN_EMAIL = "flopezmd@gmail.com";
const ADMIN_PASSWORD = "CondorRoca2026!"; // Temporary — must change on first login
const ADMIN_NAME = "Dr. Francisco Lopez";
const ADMIN_ROLE = "admin";

async function main() {
  console.log("🔐 Creating clinic admin account...\n");

  // 1. Find the clinic
  const { data: clinic, error: clinicErr } = await sb
    .from("clinics")
    .select("id, name")
    .eq("cuit", CLINIC_CUIT)
    .single();

  if (clinicErr || !clinic) {
    console.error("❌ Clinic not found:", clinicErr?.message);
    process.exit(1);
  }
  console.log(`  ✅ Clinic: ${clinic.name} (${clinic.id})`);

  // 2. Check if user already exists
  const { data: existingUsers } = await sb.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === ADMIN_EMAIL);

  let userId;
  if (existing) {
    userId = existing.id;
    console.log(`  ⚠️  Auth user already exists: ${userId}`);
  } else {
    // 3. Create auth user (service_role bypasses email confirmation)
    const { data: newUser, error: authErr } = await sb.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: ADMIN_NAME,
        clinic_name: clinic.name,
        role: ADMIN_ROLE,
      },
    });

    if (authErr) {
      console.error("❌ Failed to create auth user:", authErr.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`  ✅ Auth user created: ${userId}`);
  }

  // 4. Upsert profile → link to existing clinic
  const { error: profErr } = await sb.from("profiles").upsert({
    id: userId,
    clinic_id: clinic.id,
    role: ADMIN_ROLE,
    full_name: ADMIN_NAME,
    phone: "+5491127756496",
    especialidad: "Director Médico",
    matricula: "MN-149549",
    active: true,
  });

  if (profErr) {
    console.error("❌ Profile upsert failed:", profErr.message);
    process.exit(1);
  }
  console.log(`  ✅ Profile linked to ${clinic.name}`);

  // ─── Done ──────────────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("🎉 Clinic admin account ready!");
  console.log("═".repeat(50));
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role:     ${ADMIN_ROLE}`);
  console.log(`   Clinic:   ${clinic.name}`);
  console.log(`   URL:      condorsalud.com/login`);
  console.log("═".repeat(50));
  console.log("\n⚠️  Tell Dr. Francisco to change his password after first login!\n");
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});

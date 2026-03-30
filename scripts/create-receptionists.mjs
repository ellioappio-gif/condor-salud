// ─── Create receptionist accounts for Centro Médico Roca ─────
// Run: node scripts/create-receptionists.mjs

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const CLINIC_ID = "cc7b1d0c-1150-40de-820e-7f216766cc9f";
const PASSWORD = "Rocamedico1*";

const RECEPTIONISTS = [
  { name: "Nicole Ramos", email: "nicolecamilara@gmail.com" },
  { name: "Lisbeth Blanco", email: "lisbetboanco@gmail.com" },
  { name: "Fanny Di Palma", email: "fannydipalma@gmail.com" },
];

async function main() {
  console.log("👩‍💼 Creating receptionist accounts...\n");

  for (const rec of RECEPTIONISTS) {
    // Check if user already exists
    const { data: allUsers } = await sb.auth.admin.listUsers();
    const existing = allUsers.users.find((u) => u.email === rec.email);

    let userId;
    if (existing) {
      userId = existing.id;
      console.log(`  ⚠️  ${rec.name} already exists (${userId}), updating profile...`);
    } else {
      const { data, error } = await sb.auth.admin.createUser({
        email: rec.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: rec.name,
          clinic_name: "Centro Médico Roca",
          role: "recepcion",
        },
      });

      if (error) {
        console.error(`  ❌ ${rec.name}: ${error.message}`);
        continue;
      }
      userId = data.user.id;
      console.log(`  ✅ ${rec.name} — auth user created`);
    }

    // Wait for trigger then overwrite profile
    await new Promise((r) => setTimeout(r, 1000));

    const { error: profErr } = await sb.from("profiles").upsert({
      id: userId,
      clinic_id: CLINIC_ID,
      role: "recepcion",
      full_name: rec.name,
      active: true,
    });

    if (profErr) {
      console.error(`     ❌ Profile: ${profErr.message}`);
    } else {
      console.log(`     ✅ Profile linked (recepcion)`);
    }
  }

  console.log("\n" + "═".repeat(55));
  console.log("🎉 Receptionist accounts ready!");
  console.log("═".repeat(55));
  for (const rec of RECEPTIONISTS) {
    console.log(`   ${rec.name.padEnd(20)} ${rec.email}`);
  }
  console.log(`   Password (all):   ${PASSWORD}`);
  console.log(`   Role:             recepcion`);
  console.log(`   URL:              condorsalud.com/login`);
  console.log("═".repeat(55));
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});

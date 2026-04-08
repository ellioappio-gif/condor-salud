// Apply migration 022: Enable Realtime on turnos + pacientes tables
// Run with: node scripts/apply-migration-022.mjs

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  // Verify tables exist
  const { data: t } = await sb.from("turnos").select("id").limit(1);
  const { data: p } = await sb.from("pacientes").select("id").limit(1);
  console.log("✓ turnos table reachable:", t !== null);
  console.log("✓ pacientes table reachable:", p !== null);

  console.log("\n════════════════════════════════════════════════");
  console.log("  MANUAL STEP — Run in Supabase SQL Editor:");
  console.log("  https://supabase.com/dashboard/project/frgzixfvqifjvslfjzdj/sql/new");
  console.log("════════════════════════════════════════════════\n");
  console.log("  ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos;");
  console.log("  ALTER PUBLICATION supabase_realtime ADD TABLE public.pacientes;\n");
  console.log("This enables real-time INSERT/UPDATE events for doctor notifications.");
  console.log("Without it, the useRealtimeTurnoNotifications hook subscribes but never fires.\n");
}

run().catch(console.error);

# Migration 013 — Five Missing Features

## Tables Created

| Table                       | Feature                      |
| --------------------------- | ---------------------------- |
| `club_plans`                | Health Club plan definitions |
| `club_memberships`          | Patient ↔ plan subscriptions |
| `prescription_fees`         | Club discount ledger         |
| `digital_prescriptions`     | QR prescriptions             |
| `prescription_medications`  | Medication rows per Rx       |
| `doctor_verifications`      | Matrícula/DNI review queue   |
| `verification_documents`    | Uploaded doc files           |
| `doctor_public_profiles`    | SEO doctor pages             |
| `doctor_reviews_public`     | Patient reviews              |
| `health_tracker_categories` | Glucose, weight, BP, etc.    |
| `health_tracker_items`      | Per-patient measurements     |

## How to Apply

### Option A — Supabase CLI (recommended)

```bash
# From the project root
npx supabase db push
```

### Option B — Supabase Dashboard (manual)

1. Go to **Supabase Dashboard → SQL Editor**
2. Open `supabase/migrations/013_missing_features.sql`
3. Copy the full SQL and run it
4. Verify with: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`

### Option C — psql direct

```bash
psql "$DATABASE_URL" < supabase/migrations/013_missing_features.sql
```

## Post-Migration Checks

```sql
-- Verify all 11 tables exist
SELECT count(*) FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'club_plans','club_memberships','prescription_fees',
    'digital_prescriptions','prescription_medications',
    'doctor_verifications','verification_documents',
    'doctor_public_profiles','doctor_reviews_public',
    'health_tracker_categories','health_tracker_items'
  );
-- Expected: 11

-- Verify seed data
SELECT slug, name_es FROM club_plans ORDER BY sort_order;
-- Expected: basico, plus, familiar

SELECT slug, name FROM health_tracker_categories ORDER BY sort_order;
-- Expected: glucosa, peso, presion-arterial, temperatura, frecuencia-cardiaca, oximetria
```

## Environment Variables Needed

After migration, ensure these are set in Vercel / `.env.local`:

| Variable      | Purpose                                 | Example                    |
| ------------- | --------------------------------------- | -------------------------- |
| `QR_BASE_URL` | Base URL for QR code verification links | `https://condorsalud.com`  |
| `CRON_SECRET` | Shared secret for cron endpoint auth    | Any random 32+ char string |

## Rollback

To undo (destructive — drops data):

```sql
DROP TABLE IF EXISTS health_tracker_items CASCADE;
DROP TABLE IF EXISTS health_tracker_categories CASCADE;
DROP TABLE IF EXISTS doctor_reviews_public CASCADE;
DROP TABLE IF EXISTS doctor_public_profiles CASCADE;
DROP TABLE IF EXISTS verification_documents CASCADE;
DROP TABLE IF EXISTS doctor_verifications CASCADE;
DROP TABLE IF EXISTS prescription_medications CASCADE;
DROP TABLE IF EXISTS digital_prescriptions CASCADE;
DROP TABLE IF EXISTS prescription_fees CASCADE;
DROP TABLE IF EXISTS club_memberships CASCADE;
DROP TABLE IF EXISTS club_plans CASCADE;
```

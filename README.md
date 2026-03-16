# Cóndor Salud

Plataforma unificada de inteligencia para el sistema de salud argentino.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS (custom palette — see BRANDKIT.md)
- **Database:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** Anthropic Claude (Cora chatbot, clinical triage)
- **Auth:** Supabase Auth + Google OAuth (AES-256-GCM encrypted tokens)
- **Rate Limiting:** Upstash Redis
- **Monitoring:** Sentry (client + server + edge)
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Deploy:** Vercel + Docker

## Getting Started

```bash
npm install
cp .env.example .env.local  # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — marketing site
Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) — product dashboard

> **Note:** All env vars are optional. Without Supabase keys the app falls back to mock data.

## Modules

| #   | Module        | Route                      | Description                              |
| --- | ------------- | -------------------------- | ---------------------------------------- |
| 1   | Dashboard     | `/dashboard`               | KPIs, alerts, overview                   |
| 2   | Verificación  | `/dashboard/verificacion`  | Patient coverage verification            |
| 3   | Facturación   | `/dashboard/facturacion`   | AFIP electronic billing                  |
| 4   | Rechazos      | `/dashboard/rechazos`      | Rejection management & reprocessing      |
| 5   | Financiadores | `/dashboard/financiadores` | Payer breakdown & analytics              |
| 6   | Inflación     | `/dashboard/inflacion`     | Inflation impact tracker                 |
| 7   | Pacientes     | `/dashboard/pacientes`     | Patient registry                         |
| 8   | Agenda        | `/dashboard/agenda`        | Appointment scheduling + Google Calendar |
| 9   | Inventario    | `/dashboard/inventario`    | Medical supply inventory                 |
| 10  | Reportes      | `/dashboard/reportes`      | Custom report builder                    |
| 11  | Farmacia      | `/dashboard/farmacia`      | Pharmacy, prescriptions, delivery        |
| 12  | Telemedicina  | `/dashboard/telemedicina`  | Video consultations (Daily.co)           |
| 13  | Directorio    | `/dashboard/directorio`    | Doctor directory + search                |
| 14  | Triage        | `/dashboard/triage`        | AI-assisted symptom triage               |

### Patient Portal

| Route                    | Description              |
| ------------------------ | ------------------------ |
| `/paciente`              | Patient dashboard        |
| `/paciente/perfil`       | Profile & insurance      |
| `/paciente/turnos`       | Appointments             |
| `/paciente/historia`     | Medical history timeline |
| `/paciente/sintomas`     | Symptom checker (triage) |
| `/paciente/teleconsulta` | Video consultation       |
| `/paciente/medicamentos` | Medication tracker       |
| `/paciente/cobertura`    | Coverage details         |

## Project Structure

```text
src/
├── app/
│   ├── page.tsx               # Landing page (marketing)
│   ├── layout.tsx             # Root layout + metadata
│   ├── api/                   # Route handlers (REST)
│   │   ├── auth/              # Login, register, Google OAuth
│   │   ├── chatbot/           # Cora AI chatbot
│   │   ├── google/calendar/   # Google Calendar CRUD
│   │   ├── health/            # Health check endpoint
│   │   ├── triage/            # Triage actions
│   │   └── farmacia/          # Pharmacy actions
│   ├── dashboard/             # 14 dashboard modules
│   │   ├── configuracion/     # 7 settings sub-pages
│   │   └── ...
│   └── paciente/              # Patient-facing portal
├── components/                # Shared UI components
│   ├── ui/                    # Primitives (buttons, inputs)
│   └── wizard/                # Onboarding wizard
├── hooks/                     # SWR data hooks
└── lib/
    ├── auth/                  # Auth context, session
    ├── hooks/                 # Module-specific SWR hooks
    ├── security/              # Rate limiting, sanitize, crypto
    ├── services/              # Data services (mock + Supabase)
    ├── supabase/              # Supabase client config
    ├── validations/           # Zod schemas
    ├── types.ts               # Domain types & interfaces
    └── utils.ts               # Formatters, helpers
```

## Security

- AES-256-GCM token encryption for Google OAuth
- Server-side rate limiting (Upstash Redis)
- Input sanitization on all API routes
- Zod validation on all POST endpoints
- CSP headers via Next.js middleware
- httpOnly session cookies
- PII redaction in logs (pino)

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm test             # Vitest unit tests
npx playwright test  # E2E tests
```

## Deploy

### Vercel (recommended)

```bash
npm i -g vercel && vercel
```

### Docker

```bash
docker-compose up --build
```

## Brand

See [BRANDKIT.md](BRANDKIT.md) for full guidelines.

- **Celeste:** #75AADB / Dark: #4A7FAF
- **Gold:** #F6B40E
- **Ink:** #1A1A1A
- **Font display:** Georgia
- **Font body:** system-ui

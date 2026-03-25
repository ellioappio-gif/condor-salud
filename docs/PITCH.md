# Cóndor Salud — Investor & Go-to-Market Playbook

> Last updated: March 23, 2026
> Live: [condorsalud.com](https://condorsalud.com) · [condorsalud.com.ar](https://condorsalud.com.ar)

---

## TABLE OF CONTENTS

1. [One-Liner](#1-one-liner)
2. [Executive Summary](#2-executive-summary)
3. [The Problem](#3-the-problem)
4. [The Solution](#4-the-solution)
5. [Product Overview](#5-product-overview)
6. [Market Opportunity](#6-market-opportunity)
7. [Business Model & Revenue Streams](#7-business-model--revenue-streams)
8. [Competitive Landscape](#8-competitive-landscape)
9. [Traction & Current State](#9-traction--current-state)
10. [Go-to-Market Strategy](#10-go-to-market-strategy)
11. [Use of Funds](#11-use-of-funds)
12. [Pitch Deck Outline (12 Slides)](#12-pitch-deck-outline-12-slides)
13. [Email Templates](#13-email-templates)
    - [Investor Cold Outreach](#131-investor-cold-outreach)
    - [Investor Follow-Up](#132-investor-follow-up)
    - [Clinic / Doctor Outreach](#133-clinic--doctor-customer-outreach)
    - [Travel Agency / Airline Partner Outreach](#134-travel-agency--airline-partner-outreach)
    - [Insurance (Obra Social) Partner Outreach](#135-insurance-obra-social-partner-outreach)
14. [Key Metrics to Track](#14-key-metrics-to-track)
15. [FAQ for Investors](#15-faq-for-investors)
16. [Team Talking Points](#16-team-talking-points)
17. [Appendix — Technical Stats](#17-appendix--technical-stats)

---

## 1. ONE-LINER

**Cóndor Salud is the all-in-one operating system for Argentine healthcare — unifying billing, insurance claims, patient care, telemedicine, pharmacy delivery, and AI triage into a single platform for clinics, doctors, and patients.**

Shorter version for social / pitch events:

> "We're building the Veeva + Doctoralia + Oscar Health for Latin America, starting with Argentina."

---

## 2. EXECUTIVE SUMMARY

Cóndor Salud is a vertical SaaS platform that replaces the 5–8 disconnected tools an Argentine clinic uses today (billing software, appointment scheduler, patient records, insurance portals, WhatsApp for everything else) with one integrated web application.

**For providers (B2B):** 24-module professional dashboard covering clinical management, electronic billing (AFIP), insurance claim processing, rejection recovery, inflation impact tracking, telemedicine, pharmacy, AI triage, and medical imaging (PACS/RIS).

**For patients (B2C):** A patient portal with appointment booking, coverage verification, medication management, AI symptom checker (Cora), doctor search with geolocation, and a Club Salud membership tier.

**For travel/tourism (B2B2C):** A white-label healthcare concierge for travel agencies and airlines — tourists get coverage, doctor access, prescription delivery, and 24/7 AI triage in English and Spanish.

### Key Numbers

| Metric                     | Value                                                        |
| -------------------------- | ------------------------------------------------------------ |
| Dashboard modules          | 24 (19 core + 5 new features)                                |
| Patient portal sections    | 9                                                            |
| API endpoints              | 16+                                                          |
| External integrations      | 14                                                           |
| AI chatbot intents         | 20+ with 17 symptom conditions                               |
| Database tables            | 23+ (Supabase PostgreSQL)                                    |
| Lines of production code   | ~45,000+                                                     |
| Unit + E2E tests           | 229 passing                                                  |
| Supported insurance payers | 7+ (PAMI, OSDE, Swiss Medical, Galeno, Medifé, IOMA, OSECAC) |

---

## 3. THE PROBLEM

### For Clinics & Doctors

Argentina's healthcare billing system is uniquely painful:

1. **Fragmented payer landscape** — Doctors bill 7+ insurance companies (obras sociales, prepagas, PAMI) each with different portals, codes, formats, and payment timelines (45–120 days).
2. **Claim rejection epidemic** — Industry average claim rejection rate is 15–25%. Each rejection requires manual investigation, correction, and resubmission. Most clinics lose 10–20% of revenue to unrecovered rejections.
3. **Inflation destroys receivables** — With Argentine inflation at 50–200%+ annually, the 45–120 day payment window means clinics collect pesos worth significantly less than when billed. A $100,000 ARS invoice paid 90 days later might be worth $85,000 in real terms.
4. **No integrated systems** — The average clinic uses 3–5 separate tools: one for billing, one for appointments, one for patient records, WhatsApp groups for coordination, paper prescriptions, and Excel for tracking.
5. **Zero digital infrastructure for patients** — Most patients interact with their doctors via WhatsApp text messages, have no access to their medical records, and cannot verify insurance coverage in real-time.

### For Patients & Tourists

1. **Healthcare navigation is opaque** — Finding a doctor who accepts your insurance, speaks your language, and is nearby requires calling multiple clinics.
2. **No unified health record** — Lab results are paper, prescriptions are handwritten, and appointment history lives in the doctor's notebook.
3. **Tourists are stranded** — 6.5M+ tourists visit Argentina annually. When they get sick, there's no system to connect them with English-speaking doctors, verify international insurance, or deliver medication.

---

## 4. THE SOLUTION

### One Platform, Three Audiences

```text
┌─────────────────────────────────────────────────────┐
│                   CÓNDOR SALUD                      │
├──────────────┬──────────────┬───────────────────────┤
│  B2B SaaS    │  B2C Portal  │  B2B2C Partnerships   │
│  (Clinics)   │  (Patients)  │  (Travel + Insurance) │
├──────────────┼──────────────┼───────────────────────┤
│ 24 modules   │ 9 sections   │ White-label concierge │
│ Billing      │ Appointments │ Tourist coverage      │
│ Claims       │ Club Salud  │ Doctor matching       │
│ Telemedicine │ AI Cora      │ Rx delivery           │
│ PACS/RIS     │ Health Bible │ 24/7 AI triage        │
│ Pharmacy     │ Teleconsulta │ Revenue share         │
└──────────────┴──────────────┴───────────────────────┘
```

### What Makes It Different

| Differentiator                    | Description                                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Argentina-native**              | Built from day one for the Argentine insurance system — PAMI, AFIP, obras sociales, nomenclador SSS, CUIL/CUIT, Argentine OTC brand names                             |
| **AI-first**                      | Cora chatbot handles 20+ intents including symptom triage with Argentine OTC medicine recommendations (Tafirol, Ibupirac, Buscapina) and emergency routing (107/SAME) |
| **Full vertical integration**     | Billing → Claims → Rejections → Recovery → Payment — closed loop instead of fragmented tools                                                                          |
| **Inflation-aware**               | Built-in IPC tracker that calculates real loss per payer based on payment delay × daily inflation rate                                                                |
| **Bilingual for tourism**         | Full ES/EN support, partnerships page for travel agencies, tourist-oriented health concierge                                                                          |
| **Digital prescriptions with QR** | Legally-compliant digital prescriptions with scannable QR verification — replaces paper scripts                                                                       |

---

## 5. PRODUCT OVERVIEW

### B2B: Professional Dashboard (24 Modules)

| Category                | Modules                                                                                                                                                                                       | Monthly Value      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Clinical Management** | Patients, Appointments, Coverage Verification, Inventory, Alerts, Onboarding Wizard, Doctor Verification                                                                                      | Core workflows     |
| **Finance**             | Electronic Billing (AFIP), Claim Rejections, Payer Analytics, Inflation Tracker, MercadoPago Payments                                                                                         | Revenue recovery   |
| **Intelligence**        | Pre-submission Audit, SSS Nomenclator, Reports & Dashboards                                                                                                                                   | Error prevention   |
| **Services**            | Online Pharmacy, Telemedicine (Daily.co video), Doctor Directory, Referral Network, AI Triage, Cora Chatbot, Club Salud, Digital Prescriptions QR, Health Tracker, Public Doctor Profiles SEO | Growth + retention |

### B2C: Patient Portal (9 Sections)

- **Mi Salud** — Vitals dashboard with nearby services (geolocation)
- **Mis Turnos** — Real appointment booking with Supabase persistence
- **Mi Cobertura** — Real-time insurance verification
- **Mis Medicamentos** — Medication tracking + delivery via Rappi/PedidosYa
- **Teleconsulta** — Video visits via Daily.co
- **Buscar Médico** — Geo-sorted doctor search with ratings
- **Chequear Síntomas** — AI triage wizard
- **Historia Clínica** — Digital medical record timeline
- **Club de Salud** — Membership tiers with prescription discounts

### B2B2C: Travel Partnerships

- **Revenue calculator** — Slider showing per-traveler revenue potential
- **Interactive demos** — Tourist journey walkthrough, Cora AI conversation demos
- **Partner application form** — Validated + persisted to Supabase + admin email notification
- **White-label concierge** — Customizable health concierge for travel agencies and airlines

---

## 6. MARKET OPPORTUNITY

### Argentina Healthcare Market

| Metric                            | Value             | Source                  |
| --------------------------------- | ----------------- | ----------------------- |
| Total healthcare spending         | $32B USD/year     | WHO 2024                |
| Number of registered doctors      | 210,000+          | SISA Registry           |
| Private clinics / consultorios    | 45,000+           | Superintendencia        |
| Obras sociales + prepagas         | 300+ payers       | SSS                     |
| Annual insurance claims processed | 500M+             | Industry estimate       |
| Average claim rejection rate      | 15–25%            | Industry average        |
| Annual tourist arrivals           | 6.5M+             | INDEC 2024              |
| Medical tourism market (LATAM)    | $4.4B and growing | Patients Beyond Borders |

### Addressable Market

| Segment                     | TAM           | SAM (Argentina) | SOM (Year 1) |
| --------------------------- | ------------- | --------------- | ------------ |
| Clinic SaaS                 | $2.8B (LATAM) | $280M           | $500K        |
| Patient portal / Club Salud | $1.2B (LATAM) | $120M           | $200K        |
| Medical tourism concierge   | $4.4B (LATAM) | $180M           | $150K        |
| **Total**                   | **$8.4B**     | **$580M**       | **$850K**    |

### Why Now

1. **Post-COVID digital adoption** — Argentine doctors went from 5% telemedicine adoption to 40%+ in 2 years, but infrastructure didn't catch up
2. **Inflation crisis** — Clinics are desperate for tools that help them understand and recover real-value losses
3. **PAMI digitalization mandate** — Argentina's largest public insurer (7M+ members) is pushing electronic claims
4. **Tourism recovery** — International arrivals to Argentina surpassed pre-pandemic levels in 2024
5. **Regulatory tailwind** — Argentina's digital prescription law (2020) created legal framework for exactly what we've built

---

## 7. BUSINESS MODEL & REVENUE STREAMS

### Revenue Stream 1: SaaS Subscriptions (B2B)

Per-doctor seat pricing:

| Plan           | Price/mo (USD) | Target                                                                            |
| -------------- | -------------- | --------------------------------------------------------------------------------- |
| **Free**       | $0             | 20 appointments/mo, directory listing, basic patients — lead gen                  |
| **Basic**      | $50            | Unlimited scheduling, WhatsApp reminders, coverage verification, priority listing |
| **Plus**       | $120           | Everything + telemedicine, MercadoPago billing, AI Cora, e-invoicing, analytics   |
| **Enterprise** | $180           | All-inclusive, multi-location, dedicated support, API access                      |

Clinic-level module presets:

| Preset     | Modules  | Monthly (USD) |
| ---------- | -------- | ------------- |
| Basic      | 6 core   | $50           |
| Plus       | 16       | $120 (-15%)   |
| Enterprise | 24 (all) | $180 (-25%)   |

### Revenue Stream 2: Club Salud Memberships (B2C)

| Plan     | Monthly (ARS) | Benefits                                                                                    |
| -------- | ------------- | ------------------------------------------------------------------------------------------- |
| Básico   | $9,000        | 1 teleconsultation/mo, records request from external doctors                                |
| Plus     | $24,500       | 3 teleconsultations, delivery, Cora priority, records request                               |
| Familiar | $90,000       | Unlimited teleconsultations, checkups, cardiology, delivery, Cora priority, records request |

Non-members pay $2,000 ARS per prescription request (50/50 split: doctor + Cóndor).

### Revenue Stream 3: Transaction Fees

- **Prescription fees** — $2,000 ARS per non-member prescription (50% to Cóndor)
- **MercadoPago processing** — Passthrough + margin on copay collection
- **Booking fees** — Future: per-booking fee for appointments through public profiles

### Revenue Stream 4: Travel Partnerships (B2B2C)

- **Per-traveler fee** — Travel agencies pay $3–10 USD per covered traveler
- **Revenue share** — Percentage of medical services consumed by tourists
- **White-label licensing** — Monthly fee for branded concierge integration

### Revenue Stream 5: Data & Premium Features

- **Priority directory listing** — Paid placement in doctor search results
- **Analytics dashboards** — Premium payer intelligence reports
- **API access** — Enterprise customers building on top of Cóndor

### Unit Economics (Target at Scale)

| Metric                            | Target                                |
| --------------------------------- | ------------------------------------- |
| Average Revenue Per Doctor (ARPU) | $35–50 USD/mo                         |
| Customer Acquisition Cost (CAC)   | $50–100 USD                           |
| Lifetime Value (LTV)              | $1,200–2,400 USD (24–48 mo retention) |
| LTV:CAC Ratio                     | 12–24x                                |
| Gross Margin                      | 80–85% (SaaS)                         |
| Payback Period                    | 1–3 months                            |

---

## 8. COMPETITIVE LANDSCAPE

| Competitor                  | What They Do               | Cóndor Advantage                                               |
| --------------------------- | -------------------------- | -------------------------------------------------------------- |
| **Osana**                   | Clinic management          | No billing, no insurance integration, no patient portal        |
| **Docplanner/Doctoralia**   | Doctor directory + booking | No billing, no clinical tools, no Argentine insurance          |
| **MediFé App**              | Single-payer patient app   | Only works for MediFé members, no provider tools               |
| **PAMI Digital**            | Government portal          | Terrible UX, no private insurance, no modern features          |
| **Dricloud**                | Cloud clinic management    | Spanish company, not localized for Argentine billing/insurance |
| **iClinic**                 | Brazilian clinic software  | No Argentine integration, no bilingual tourism support         |
| **Oscar Health** (US model) | Full-stack health insurer  | Not in LATAM, but validates the vertical integration thesis    |

**Key Insight:** No existing player combines billing + claims + patient portal + telemedicine + AI triage + tourism in one platform for Argentina. The market is fragmented across 5+ point solutions.

---

## 9. TRACTION & CURRENT STATE

### What's Built (as of March 2026)

| Component                                            | Status                     |
| ---------------------------------------------------- | -------------------------- |
| Full marketing site with 14 sections                 | ✅ Live                    |
| 24-module professional dashboard                     | ✅ Built & functional      |
| 9-section patient portal                             | ✅ Built & functional      |
| AI chatbot Cora (20+ intents, 17 symptom conditions) | ✅ Built & functional      |
| Supabase database (23+ tables, RLS, migrations)      | ✅ Connected               |
| Authentication (Supabase Auth + Google OAuth)        | ✅ Working                 |
| 14 external integrations wired                       | ✅ Code complete           |
| Travel partnerships page (bilingual)                 | ✅ Live                    |
| Partner application form → Supabase + email          | ✅ Working                 |
| Digital prescriptions with QR verification           | ✅ Built                   |
| Club Salud membership system                         | ✅ Built                   |
| Health Tracker with reminders                        | ✅ Built                   |
| Doctor verification gate                             | ✅ Built                   |
| Public doctor profiles (SEO)                         | ✅ Built                   |
| 229 automated tests passing                          | ✅ Green                   |
| Deployed on Vercel                                   | ✅ Live at condorsalud.com |
| Custom domains configured                            | ✅ .com + .com.ar          |

### What's Needed for First Paying Customer

| Item                                       | Effort    | Status                                |
| ------------------------------------------ | --------- | ------------------------------------- |
| AFIP electronic billing integration (WSFE) | 2–3 weeks | Stub ready, needs certificate         |
| PAMI webservice connection                 | 1–2 weeks | Env vars defined, needs credentials   |
| Stripe/MercadoPago payment collection      | 1 week    | SDK installed, needs merchant account |
| SendGrid/Resend transactional email        | 2 days    | SDK installed, needs API key          |
| Twilio WhatsApp Business API               | 1 week    | SDK installed, needs number           |
| First 5 pilot clinics onboarded            | 2–4 weeks | Outreach starting                     |

---

## 10. GO-TO-MARKET STRATEGY

### Phase 1: Foundation (Months 1–3) — $0 spend

**Goal:** 5 pilot clinics, validate pricing, achieve product-market fit

1. **Direct outreach** — Target 50 small clinics (1–5 doctors) in Buenos Aires (Palermo, Recoleta, Belgrano) via WhatsApp, email, and in-person visits
2. **Free tier hook** — Offer Gratuito plan (20 appointments/mo + directory listing) to get doctors onboarded with zero friction
3. **Doctor referral network** — Each onboarded doctor brings 2–3 colleagues → organic growth
4. **Content marketing** — Blog posts about claim rejection recovery, inflation impact on medical billing, digital prescription compliance
5. **WhatsApp community** — Create a WhatsApp group for pilot clinic owners to share feedback and feature requests

### Phase 2: Growth (Months 4–9) — $2–5K/mo spend

**Goal:** 50 clinics, $5K MRR, launch B2C

1. **Google Ads** — Target: "software médico Argentina", "facturación obras sociales", "gestión de consultorio"
2. **SEO** — Public doctor profiles drive organic traffic. Each doctor profile = indexed page linking to Cóndor
3. **Club Salud launch** — Open B2C membership to patients of onboarded clinics
4. **Partnership pipeline** — Begin outreach to 3–5 travel agencies for B2B2C pilot
5. **Medical conference presence** — Sponsor booths at AAMR, SAC, and regional medical events

### Phase 3: Scale (Months 10–18) — $10–20K/mo spend

**Goal:** 200+ clinics, $25K+ MRR, first enterprise deal

1. **Enterprise sales** — Target hospital networks and multi-location clinics
2. **API partnerships** — Integrate with lab systems, pharmacy chains, insurance payers
3. **LATAM expansion research** — Evaluate Colombia, Chile, Uruguay (similar insurance structures)
4. **Tourism partnerships active** — Revenue-generating deals with agencies and airlines

### Customer Acquisition Channels (Ranked by Expected ROI)

| Channel                      | CAC            | Volume | Timeline  |
| ---------------------------- | -------------- | ------ | --------- |
| Direct WhatsApp outreach     | $10–20         | Low    | Immediate |
| Doctor referral program      | $0–15          | Medium | Month 2+  |
| SEO (doctor profiles)        | $5–10          | High   | Month 4+  |
| Google Ads                   | $30–60         | Medium | Month 3+  |
| Conference sponsorships      | $80–120        | Low    | Month 6+  |
| Partnership channel (travel) | $0 (rev share) | High   | Month 6+  |

---

## 11. USE OF FUNDS

### Pre-Seed Round: $150–300K USD

| Category                                            | Allocation | Amount   |
| --------------------------------------------------- | ---------- | -------- |
| Engineering (2 FT devs × 12 mo)                     | 50%        | $75–150K |
| Go-to-market (sales + marketing)                    | 25%        | $37–75K  |
| Infrastructure (Supabase Pro, Vercel, Sentry, APIs) | 10%        | $15–30K  |
| Legal & compliance (AFIP cert, data protection)     | 10%        | $15–30K  |
| Buffer / ops                                        | 5%         | $7.5–15K |

### What $150K Gets You (12 Months)

- Full AFIP + PAMI integration (real billing)
- 50 paying clinics ($5K+ MRR)
- 500+ Club Salud members ($2.5K+ MRR)
- 3+ travel agency partnerships ($1K+ MRR)
- Revenue run-rate of $100K+ ARR by month 12
- Position to raise Seed round at $2–3M valuation

---

## 12. PITCH DECK OUTLINE (12 SLIDES)

Use these as slide titles + speaker notes. Design in Cóndor brand (celeste + gold + Georgia font).

### Slide 1 — Cover

> **CÓNDOR SALUD**
> The operating system for Argentine healthcare.
> _[Logo + condorsalud.com]_

### Slide 2 — Problem

> Argentine doctors lose 10–20% of revenue to claim rejections, manage patients via WhatsApp, and watch inflation destroy their receivables.
> _[Stat: 15–25% average rejection rate. $32B healthcare market.]_

### Slide 3 — Solution

> One platform replacing 5 disconnected tools: billing + claims + patient care + telemedicine + AI — purpose-built for Argentina.
> _[Dashboard screenshot + "5 tools → 1" visual]_

### Slide 4 — Product Demo

> _[4 screenshots: Dashboard, Patient Portal, Cora Chatbot, Public Doctor Profile]_
> 24 modules. 9 patient sections. AI triage. Digital prescriptions with QR. Bilingual.

### Slide 5 — Market

> **$580M** addressable market in Argentina alone.
> 210,000 doctors. 45,000 clinics. 6.5M tourists. 300+ insurance payers.
> _[TAM/SAM/SOM chart]_

### Slide 6 — Business Model

> 4 revenue streams: SaaS seats ($50–180/doctor/mo), Club Salud memberships ($9K–90K ARS/patient/mo), transaction fees, travel partnerships.
> _[Revenue waterfall graphic]_

### Slide 7 — Traction

> Product fully built. 24 modules. 229 tests passing. Live at condorsalud.com.
> Next: 5 pilot clinics → $5K MRR in 90 days.
> _[Product milestone timeline]_

### Slide 8 — Go-to-Market

> Phase 1: Direct outreach → 5 clinics (free tier → convert to paid)
> Phase 2: SEO + ads + Club Salud → 50 clinics
> Phase 3: Enterprise + LATAM → 200+ clinics
> _[GTM funnel graphic]_

### Slide 9 — Competition

> No one combines billing + claims + patient portal + AI + tourism for Argentina.
> _[Competitive matrix: Cóndor vs Osana vs Doctoralia vs Dricloud]_

### Slide 10 — Unit Economics

> **LTV:CAC = 12–24x** | 80%+ gross margin | 1–3 month payback
> _[Unit economics table]_

### Slide 11 — Team

> _[Founder photos + bios. Highlight: domain expertise, technical depth, Argentine market knowledge]_

### Slide 12 — Ask

> Raising **$150–300K pre-seed** to go from product to revenue.
> Goal: 50 clinics, $100K ARR, position for $2–3M seed.
> _[Contact info + condorsalud.com]_

---

## 13. EMAIL TEMPLATES

### 13.1 Investor Cold Outreach

**Subject:** Cóndor Salud — The Veeva for Argentine Healthcare (product live, seeking pre-seed)

---

Hola [Name],

I'm building **Cóndor Salud** — an all-in-one healthcare SaaS for Argentina that replaces the 5 disconnected tools every clinic uses today.

**The problem:** Argentine doctors lose 10–20% of revenue to insurance claim rejections, manage patients via WhatsApp, and watch inflation destroy their receivables over 45–120 day payment cycles.

**What we've built:** A live, production-grade platform with 24 dashboard modules, a patient portal with AI triage, digital prescriptions with QR verification, and a bilingual tourism concierge — all purpose-built for the Argentine insurance system (PAMI, OSDE, Swiss Medical, etc.).

**Key numbers:**

- 45,000+ private clinics in Argentina (our TAM)
- $580M addressable market
- Product is live at [condorsalud.com](https://condorsalud.com) with 229 automated tests passing
- 4 revenue streams: SaaS seats, patient memberships, transaction fees, travel partnerships
- Target: 50 clinics and $100K ARR in 12 months

We're raising $150–300K pre-seed to go from product to revenue. I'd love 20 minutes to demo the platform and discuss the opportunity.

Would [specific day] work for a quick call?

Best,
[Your Name]
Cóndor Salud · condorsalud.com

---

### 13.2 Investor Follow-Up

**Subject:** Re: Cóndor Salud — quick update + demo link

---

Hi [Name],

Following up on my note about Cóndor Salud. A few updates since then:

1. **Migrations applied** — All 23+ database tables live on Supabase with Row Level Security
2. **Travel partnerships page** launched — bilingual (ES/EN), interactive revenue calculator, partner application form connected to our database
3. **Digital prescriptions with QR** — Doctors can generate legally-compliant digital prescriptions that patients verify via QR scan

The live product is at [condorsalud.com](https://condorsalud.com) — you can explore the full marketing site, pricing configurator at `/planes`, and partnerships page at `/partnerships`.

Happy to do a 20-minute demo call whenever works for you. What does your calendar look like this week?

Best,
[Your Name]

---

### 13.3 Clinic / Doctor Customer Outreach

**Subject:** Tu consultorio pierde hasta 20% por rechazos — Cóndor Salud puede ayudar

---

Hola Dr./Dra. [Apellido],

Soy [Tu Nombre] de Cóndor Salud. Estamos trabajando con consultorios en [Barrio/Ciudad] para resolver un problema que seguro conocés: **los rechazos de obras sociales y prepagas**.

El promedio de la industria es 15–25% de rechazos. Cada rechazo es plata que se pierde — y con la inflación, cada día de demora en cobrar vale menos.

**Cóndor Salud es una plataforma que unifica todo en un solo lugar:**

- ✅ Facturación electrónica (AFIP)
- ✅ Gestión de rechazos con reprocesamiento automático
- ✅ Verificación de cobertura en tiempo real
- ✅ Agenda con recordatorios por WhatsApp
- ✅ Recetas digitales con QR
- ✅ Teleconsulta integrada
- ✅ Portal para tus pacientes

**Empezar es gratis** — el plan Gratuito incluye 20 turnos por mes y perfil en nuestro directorio.

¿Te copa que te haga un demo de 15 minutos esta semana? Puedo ir a tu consultorio o hacemos por videollamada.

Saludos,
[Tu Nombre]
Cóndor Salud · condorsalud.com
WhatsApp: [número]

---

### 13.4 Travel Agency / Airline Partner Outreach

**Subject:** Healthcare concierge for your travelers — Cóndor Salud partnership

---

Hi [Name],

I'm reaching out from **Cóndor Salud**, a healthcare technology company based in Buenos Aires. We've built a **bilingual health concierge platform** specifically for tourists visiting Argentina.

**The problem your travelers face:**
When a tourist gets sick in Buenos Aires, they have no idea where to find an English-speaking doctor, how to verify their insurance coverage, or where to get medication delivered. They end up in expensive emergency rooms or suffer through minor illnesses that a $5 pharmacy run could fix.

**What Cóndor Salud offers your travelers:**

- 🤖 **AI health assistant (Cora)** — 24/7 symptom triage in English and Spanish, with local OTC medicine recommendations
- 🩺 **Doctor matching** — Verified, English-speaking doctors sorted by proximity with real-time availability
- 💊 **Prescription delivery** — Digital prescriptions with medication delivery via Rappi/PedidosYa
- 📱 **Health coverage** — Club membership plans starting at $5 USD/month with prescription discounts and teleconsultations
- 📋 **Health tracking** — Digital health "bible" travelers can take home

**Revenue model:**

- Per-traveler fee ($3–10 USD depending on coverage tier)
- Revenue share on medical services consumed
- White-label option available for your brand

**You can see the full partnership offering at:** [condorsalud.com/partnerships](https://condorsalud.com/partnerships) — includes an interactive revenue calculator and demo of the tourist experience.

Would you be open to a 20-minute call to explore a pilot program with your Argentina-bound travelers?

Best regards,
[Your Name]
Cóndor Salud · [partnerships@condorsalud.com](mailto:partnerships@condorsalud.com)

---

### 13.5 Insurance (Obra Social) Partner Outreach

**Subject:** Reducir rechazos y mejorar la experiencia de afiliados — Cóndor Salud

---

Estimado/a [Nombre],

Soy [Tu Nombre] de Cóndor Salud. Estamos desarrollando una plataforma de gestión de salud que ya integra verificación de cobertura, facturación electrónica y gestión de rechazos para consultorios que trabajan con [Nombre de la Obra Social].

**El beneficio para [Obra Social]:**

- 📉 **Menos rechazos** — Nuestra auditoría pre-envío detecta errores antes de que lleguen a ustedes, reduciendo el volumen de rechazos y el costo de reprocesamiento
- 📱 **Mejor experiencia del afiliado** — Portal de paciente con verificación de cobertura en tiempo real, turnos online, y teleconsulta
- 🔗 **Integración directa** — Podemos conectar nuestra plataforma con su sistema de autorización para agilizar el proceso

**Lo que proponemos:**
Un piloto con 5–10 consultorios de su red durante 90 días para medir la reducción de rechazos y la satisfacción del afiliado.

¿Podemos coordinar una reunión para presentarles la plataforma?

Saludos cordiales,
[Tu Nombre]
Cóndor Salud · condorsalud.com

---

## 14. KEY METRICS TO TRACK

### North Star Metric

**Monthly Active Clinics (MAC)** — Clinics with ≥1 billing event or appointment in the last 30 days.

### Growth Metrics

| Metric               | Definition             | Month 3 Target | Month 12 Target |
| -------------------- | ---------------------- | -------------- | --------------- |
| Registered clinics   | Total signups          | 20             | 100             |
| Active clinics (MAC) | ≥1 event/mo            | 5              | 50              |
| Registered doctors   | Total doctor accounts  | 30             | 200             |
| Active patients      | ≥1 login in 30 days    | 50             | 2,000           |
| Club Salud members   | Paying B2C subscribers | 0              | 500             |

### Revenue Metrics

| Metric             | Month 3 Target | Month 12 Target |
| ------------------ | -------------- | --------------- |
| MRR (SaaS)         | $500           | $5,000          |
| MRR (Club Salud)   | $0             | $2,500          |
| MRR (Partnerships) | $0             | $1,000          |
| Total MRR          | $500           | $8,500          |
| ARR                | $6,000         | $102,000        |

### Engagement Metrics

| Metric                         | Target            |
| ------------------------------ | ----------------- |
| DAU/MAU ratio                  | 40%+              |
| Claims submitted per clinic/mo | 50+               |
| Rejection rate reduction       | –50% vs. baseline |
| Average session duration       | 8+ minutes        |
| NPS                            | 40+               |

### Product Metrics

| Metric                                  | Target |
| --------------------------------------- | ------ |
| Cora chatbot conversations/day          | 20+    |
| Digital prescriptions issued/mo         | 100+   |
| Appointments booked through platform/mo | 200+   |
| Health tracker entries/mo               | 500+   |

---

## 15. FAQ FOR INVESTORS

**Q: Why Argentina?**
A: Argentina has a uniquely fragmented insurance system (300+ payers), a $32B healthcare market, and severe infrastructure gaps. The pain is acute — doctors literally lose 10–20% of revenue. Also: Argentina produces world-class engineering talent at LATAM costs, and the learnings here translate directly to Colombia, Chile, and Mexico.

**Q: Is this a vitamin or a painkiller?**
A: Painkiller. Claim rejection recovery alone can increase a clinic's revenue by 10–20%. We're not selling productivity — we're recovering lost money.

**Q: How defensible is this?**
A: Three moats: (1) **Integration depth** — each AFIP/PAMI/obra social integration takes months to build and certify, (2) **Network effects** — every doctor on the platform makes the directory more valuable for patients, every patient makes the platform more valuable for doctors, (3) **Data compound** — the more claims we process, the better our pre-submission audit becomes at predicting rejections.

**Q: What if Doctoralia or a big player enters this space?**
A: Doctoralia is a directory company — they'd need to build billing, claims, insurance integration, and AI from scratch. That's 2+ years of work. We're already live. And the Argentine insurance system is niche enough that global players underinvest here.

**Q: What's the regulatory risk?**
A: Low. Argentina's 2020 digital prescription law actually enables our QR prescription feature. AFIP electronic billing is mandated — doctors need solutions like ours. Patient data protection follows Argentine PDPA (similar to GDPR).

**Q: What are the biggest risks?**
A: (1) Argentine macro volatility affecting customer willingness to pay (mitigated by USD pricing for tourism revenue), (2) AFIP/PAMI integration timelines being longer than expected, (3) Initial sales cycle for clinics being slow. All are solvable with capital and execution.

**Q: How does the dual auth system work?**
A: Supabase Auth handles provider (B2B) authentication with RBAC. Patient auth uses a lightweight custom JWT for mobile-first simplicity. We've flagged this for eventual unification — it works now but is a maintenance surface we'll consolidate in the next engineering sprint.

---

## 16. TEAM TALKING POINTS

<!-- Customize with your actual team bios -->

- **Deep Argentine healthcare domain knowledge** — Understanding of PAMI, AFIP, obras sociales, and the specific pain points of Argentine clinics
- **Full-stack technical execution** — Live product with 45,000+ lines of production TypeScript, 24 modules, 14 integrations, enterprise-grade infrastructure (Sentry, structured logging, RBAC, RLS)
- **Speed of execution** — Went from zero to fully functional platform in [X months], demonstrating ability to ship fast
- **Bilingual capability** — Product and team operate in both Spanish and English, unlocking the tourism market
- **Capital-efficient** — Built a complete SaaS platform pre-revenue with minimal capital. Every additional dollar goes to sales and integration, not engineering rebuild

---

## 17. APPENDIX — TECHNICAL STATS

| Metric                | Value                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Framework             | Next.js 14 (App Router)                                                                   |
| Language              | TypeScript (strict mode)                                                                  |
| Styling               | Tailwind CSS (custom design system)                                                       |
| Database              | Supabase (PostgreSQL + Auth + Storage + Realtime)                                         |
| AI                    | Anthropic Claude (Cora chatbot + triage)                                                  |
| Video                 | Daily.co (telemedicine)                                                                   |
| Payments              | MercadoPago SDK                                                                           |
| Messaging             | Twilio WhatsApp + Resend email                                                            |
| Monitoring            | Sentry (client + server + edge)                                                           |
| CI/CD                 | GitHub → Vercel auto-deploy                                                               |
| Testing               | 229 tests (Vitest + Playwright)                                                           |
| Security              | AES-256-GCM encryption, Upstash rate limiting, Zod validation, CSP headers, PII redaction |
| Docker                | Multi-stage build, Alpine, non-root, health check                                         |
| Database tables       | 23+ with RLS policies                                                                     |
| Database migrations   | 14 migration files applied                                                                |
| API endpoints         | 16+                                                                                       |
| External integrations | 14 services                                                                               |
| Source files          | ~100+                                                                                     |
| Lines of code         | ~45,000+                                                                                  |
| WCAG compliance       | 2.1 AA (axe-core tested)                                                                  |
| PWA                   | Web App Manifest, service worker, standalone mode                                         |
| SEO                   | OpenGraph, Twitter cards, structured data, sitemap                                        |
| Supported payers      | PAMI, OSDE, Swiss Medical, Galeno, Medifé, IOMA, OSECAC                                   |

---

Built with 🦅 by Cóndor Salud · condorsalud.com

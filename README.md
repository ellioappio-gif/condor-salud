# Cóndor Salud

Plataforma unificada de inteligencia para el sistema de salud argentino.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Deploy:** Vercel

## Getting Started

```bash
npm install
cp .env.example .env.local  # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — marketing site
Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) — product dashboard

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (marketing)
│   ├── layout.tsx            # Root layout
│   └── dashboard/
│       ├── layout.tsx        # Dashboard sidebar layout
│       ├── page.tsx          # Main dashboard (KPIs)
│       ├── verificacion/     # Patient coverage verification
│       ├── facturacion/      # AFIP billing
│       ├── rechazos/         # Rejection management
│       ├── financiadores/    # Financiador breakdown
│       └── inflacion/        # Inflation tracker
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Stats.tsx
│   ├── Problem.tsx
│   ├── Features.tsx
│   ├── Pricing.tsx
│   ├── Waitlist.tsx
│   └── Footer.tsx
└── lib/                      # Utils, API clients, types
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

## Brand

- Celeste: #75AADB / Dark: #4A7FAF
- Gold: #F6B40E
- Ink: #1A1A1A
- Font display: Georgia
- Font body: system-ui

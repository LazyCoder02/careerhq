# CareerHQ

Personal job tracking, CV management, and AI career assistant.
More features and refinery on the way!!!

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## WebStorm Setup

1. Open the project folder in WebStorm — it will detect Next.js automatically
2. Go to **Settings → Languages & Frameworks → JavaScript → Webpack** and point it to `next.config.ts` if imports aren't resolving
3. The `@/*` path alias is configured in `tsconfig.json` — WebStorm picks this up automatically for auto-imports
4. Enable **ESLint** via Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint → Automatic
5. For Tailwind class suggestions install the **Tailwind CSS** plugin from the JetBrains marketplace

## Structure

```
app/
  dashboard/           ← all dashboard pages
    page.tsx           ← Home
    jobs/page.tsx      ← Job Tracker
    resumes/page.tsx   ← Your Resumes
    projects/page.tsx  ← Projects
    teal/page.tsx      ← Teal AI assistant
components/
  layout/Sidebar.tsx   ← sidebar nav
  ui/                  ← StatCard, StatusPill, SectionCard, ReadinessBar
lib/
  mock-data.ts         ← placeholder data — swap for Prisma queries later
types/
  index.ts             ← all TypeScript types
```

## Next steps

- Set up PostgreSQL and add `prisma/schema.prisma`
- Replace mock-data imports with Prisma queries in each page
- Add GitHub OAuth via Auth.js
- Set up Vercel Cron for Teal scheduler (`vercel.json`)
- Connect AI model for Teal (`app/api/teal/run/route.ts`)

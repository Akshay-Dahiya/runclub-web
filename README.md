# RunClub Web

Production-ready scaffold for RunClub: Next.js 15 + TypeScript + Tailwind + Prisma + NextAuth + OpenAI + Strava.

Setup

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies: `npm install`
3. Generate Prisma client: `npm run prisma:generate`
4. Run migrations: `npm run prisma:migrate`
5. Seed demo data: `npm run seed`
6. Run dev server: `npm run dev`

Deployment

This project is Vercel-ready. Ensure env vars are configured in Vercel and deploy.

Notes

- Fill in `STRAVA_CLIENT_ID/SECRET` and `GOOGLE_CLIENT_ID/SECRET` for OAuth.
- OpenAI integration requires `OPENAI_API_KEY`.

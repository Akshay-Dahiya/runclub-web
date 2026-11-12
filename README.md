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

Garmin recovery sync

- Garmin passwords and Garmin login tokens stay on the runner's computer. The local reader is read-only and writes private Markdown/JSON files by default.
- Set `NEXTAUTH_SECRET` in Vercel. Google sign-in requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; existing email/password users can use their RunClub credentials. Only the authenticated owner of a dashboard can view its Garmin readings or create an upload token.
- Before production migration, back up the database, link the repository to the intended Vercel project, pull its production environment variables into a local ignored env file, and run `npx prisma migrate deploy` with `PRISMA_DATABASE_URL` set. Never commit the pulled env file.
- Verify `/api/garmin/ingest` returns `401` to an empty request before using the RunClub sink. This confirms the deployed route exists and is waiting for its bearer token.

```bash
cd garmin-sync
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python sync_garmin.py --login
.venv/bin/python sync_garmin.py --days 3 --dry-run
.venv/bin/python sync_garmin.py --days 30 --sink runclub
```

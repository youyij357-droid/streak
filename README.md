# STREAK

STREAK is a Web3 payment link application for Polygon USDC.

## Current Status

- GitHub: `youyij357-droid/streak`
- Production: `https://streak-silk-psi.vercel.app`
- Vercel: connected and deploying
- Supabase: waiting for project creation to become available

## Available Routes

- `/` public project status page
- `/admin/login` admin login placeholder
- `/admin` admin readiness dashboard
- `/api/health` lightweight deployment health check

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill values after Supabase and supporting services are ready.

Secrets must not be committed. Store passwords and API keys in the password manager and Vercel Environment Variables.

Supabase's current key model recommends:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for browser/server user operations
- `SUPABASE_SECRET_KEY` for server-only privileged work
- Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` remain supported as fallbacks while migrating

## Supabase Setup

1. Open Supabase SQL Editor.
2. Run `supabase/schema.sql`.
3. Enable Email/Password in Authentication.
4. Create the first admin user.
5. Add Supabase env values to Vercel Production.
6. Confirm `/admin/login` signs in and `/api/health` reports `database: configured`.

## Next Build Checks

```bash
npm run lint
npm run build
```

## Next Implementation Steps

1. Add Supabase URL and keys to Vercel Environment Variables.
2. Run the Supabase schema SQL.
3. Confirm admin login with the first Auth user.
4. Build merchant, product, order, and payment link flows.

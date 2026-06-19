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

## Next Build Checks

```bash
npm run lint
npm run build
```

## Next Implementation Steps

1. Create a Supabase project after the service recovers.
2. Add Supabase URL and keys to Vercel Environment Variables.
3. Enable Email/Password authentication.
4. Replace the placeholder admin login with real Supabase auth.
5. Build merchant, product, order, and payment link flows.

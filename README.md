# Client Portal

Next.js application for the Client Portal with SSO across subdomains.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
```bash
cp .env.local.example .env.local
```

3. Run the database migration in `../supabase/migrations/001_initial_schema.sql` in your Supabase project.

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `SSO_JWT_SECRET` - Secret for signing SSO tokens (minimum 32 characters)
- `PORTAL_DOMAIN` - Portal domain (e.g., `portal.apextsgroup.com`)

## Pages

- `/login` - Login page
- `/portal/apps` - Apps dashboard (lists accessible apps)
- `/portal/settings` - User settings and admin user management

## API Routes

- `POST /api/sso/issue?app=<slug>` - Issue SSO token for app access
- `POST /api/auth/logout` - Logout user
- `POST /api/users/invite` - Invite user (admin only)

## Architecture

See `../SSO_SETUP.md` for full architecture documentation.


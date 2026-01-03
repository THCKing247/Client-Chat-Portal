# Quick Start Guide: Client Portal + Apps SSO

This guide will help you get the Client Portal and SSO system up and running quickly.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Domain configured with subdomains:
  - `portal.yourdomain.com` (portal)
  - `chat.yourdomain.com` (chat app)
  - `dc.yourdomain.com` (DC app)

## Step 1: Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Wait for the project to finish provisioning
3. Go to SQL Editor in your Supabase dashboard
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Run the migration
6. Go to Settings → API and copy:
   - Project URL
   - `anon` key
   - `service_role` key (keep this secret!)

## Step 2: Set Up Portal

1. Navigate to the portal directory:
   ```bash
   cd portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```bash
   # Copy the example (or create manually)
   cp .env.local.example .env.local
   ```

4. Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   SSO_JWT_SECRET=generate-a-random-32-char-secret-here
   PORTAL_DOMAIN=portal.yourdomain.com
   ```

   **Important**: Generate a secure random string for `SSO_JWT_SECRET` (at least 32 characters). You can use:
   ```bash
   openssl rand -hex 32
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Visit http://localhost:3000/login

## Step 3: Create Your First User

Since there's no signup page, you need to create a user manually:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter an email and password
4. Click "Create user"

Alternatively, use the Supabase SQL editor:
```sql
-- This will create a user (you'll need to set password via email)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'admin@example.com',
  crypt('your-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
```

## Step 4: Grant App Access

1. Get your user ID from Supabase (Authentication → Users)
2. Get app IDs:
   ```sql
   SELECT id, slug, name FROM apps;
   ```

3. Grant access to apps:
   ```sql
   -- Replace 'user-uuid' and 'app-uuid' with actual IDs
   INSERT INTO user_apps (user_id, app_id, role)
   VALUES (
     'user-uuid-here',
     (SELECT id FROM apps WHERE slug = 'chat'),
     'user'
   );
   ```

## Step 5: Set Up an App (Example: Chat)

1. Copy `apps/chat/sso-handler.js` to your chat app's backend
2. Install dependencies in your chat app:
   ```bash
   npm install jsonwebtoken
   ```

3. Set environment variable in your chat app:
   ```env
   SSO_JWT_SECRET=your-same-secret-from-portal
   ```

4. Implement the `/sso` route (see `apps/chat/README.md` for examples)

5. Add auth guard middleware to protect routes

## Step 6: Test the Flow

1. Log into the portal at http://localhost:3000/login
2. You should see the Apps dashboard with your accessible apps
3. Click "Open" on an app tile
4. You should be redirected to the app and authenticated

## Troubleshooting

### "Access denied to this app"
- Check that `user_apps` table has an entry for your user and the app
- Verify the `user_id` matches `auth.users(id)`

### "Invalid SSO token"
- Ensure `SSO_JWT_SECRET` is identical in portal and app
- Check that tokens aren't expired (5 min lifetime)

### Portal won't start
- Check that all environment variables are set
- Verify Supabase credentials are correct
- Check Node.js version (need 18+)

### Can't log in
- Verify user exists in Supabase Authentication
- Check email/password are correct
- Ensure email is confirmed in Supabase

## Next Steps

- Read `SSO_SETUP.md` for detailed architecture documentation
- See `apps/chat/README.md` for app integration examples
- Customize the portal UI in `portal/app/portal/`
- Add more apps by following the guide in `SSO_SETUP.md`

## Production Deployment

1. Deploy portal to Vercel/Netlify/Railway
2. Set environment variables in your hosting platform
3. Configure domain and subdomains
4. Deploy apps with SSO handlers
5. Test end-to-end flow

For production:
- Use HTTPS everywhere
- Set secure cookie flags
- Use strong `SSO_JWT_SECRET`
- Enable Supabase RLS policies
- Set up monitoring/logging


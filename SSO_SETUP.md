# Client Portal + Apps SSO Setup Guide

This document describes the SSO architecture and how to add new apps.

## Architecture Overview

- **Portal**: `portal.apextsgroup.com` - Central authentication and app management
- **Apps**: `chat.apextsgroup.com`, `dc.apextsgroup.com`, etc. - Individual applications
- **SSO Flow**: Portal issues short-lived tokens → Apps exchange for session cookies

## Database Schema

### Tables

1. **apps**: Defines available apps
   - `id` (UUID)
   - `slug` (unique identifier, e.g., "chat")
   - `name` (display name)
   - `domain` (subdomain, e.g., "chat.apextsgroup.com")
   - `created_at`

2. **clients** (optional, for multi-tenant): Organizations/companies
   - `id` (UUID)
   - `name`
   - `created_at`

3. **client_users**: Links users to clients with roles
   - `user_id` → `auth.users(id)`
   - `client_id` → `clients(id)`
   - `role` (admin, user, etc.)

4. **user_apps**: Grants users access to specific apps
   - `user_id` → `auth.users(id)`
   - `app_id` → `apps(id)`
   - `client_id` → `clients(id)` (optional, for multi-tenant)
   - `role` (admin, user, viewer, etc.)

### Row Level Security (RLS)

- Users can only read their own `user_apps` entries
- Admins can manage `user_apps` for their client
- Apps are publicly readable (for listing)

## Setup Instructions

### 1. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Get your Supabase URL and keys from Project Settings → API

### 2. Portal Setup

1. Navigate to `portal/` directory
2. Copy `.env.local.example` to `.env.local`
3. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SSO_JWT_SECRET=your-secret-key-min-32-chars
   PORTAL_DOMAIN=portal.apextsgroup.com
   ```
4. Install dependencies: `npm install`
5. Run development server: `npm run dev`

### 3. App Setup (Example: Chat App)

Each app needs to:

1. **Install SSO handler**:
   - Copy `apps/chat/sso-handler.js` to your app's backend
   - Install `jsonwebtoken`: `npm install jsonwebtoken`
   - Set `SSO_JWT_SECRET` environment variable (must match portal's secret)

2. **Create SSO exchange route**:
   ```javascript
   // Express example
   const { exchangeSSOToken, SESSION_COOKIE_NAME } = require('./sso-handler');
   
   app.get('/sso', async (req, res) => {
     const token = req.query.token;
     const result = await exchangeSSOToken(token);
     
     if (result.error) {
       return res.redirect('https://portal.apextsgroup.com/login?redirect=' + encodeURIComponent(req.originalUrl));
     }
     
     res.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
       httpOnly: true,
       secure: true,
       sameSite: 'lax',
       maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
     });
     
     res.redirect('/');
   });
   ```

3. **Add auth guard middleware**:
   ```javascript
   const { requireAppAuth } = require('./sso-handler');
   
   // Protect all routes
   app.use('/api/*', requireAppAuth);
   app.use('/dashboard/*', requireAppAuth);
   
   // Access user info in routes
   app.get('/api/user', requireAppAuth, (req, res) => {
     res.json({ user: req.user });
   });
   ```

## Adding a New App

### Step 1: Register App in Database

Run this SQL in Supabase:

```sql
INSERT INTO apps (slug, name, domain) VALUES
  ('newapp', 'New App Name', 'newapp.apextsgroup.com');
```

### Step 2: Grant User Access

Admins can grant access via the portal UI (User Settings → Invite User), or manually:

```sql
-- Get app ID
SELECT id FROM apps WHERE slug = 'newapp';

-- Grant access to a user
INSERT INTO user_apps (user_id, app_id, role)
VALUES (
  'user-uuid-here',
  'app-uuid-here',
  'user'
);
```

### Step 3: Create App SSO Handler

1. Copy `apps/chat/sso-handler.js` to your new app
2. Implement the `/sso` route (see example above)
3. Add auth guard middleware to protect routes
4. Set `SSO_JWT_SECRET` environment variable

### Step 4: Test

1. Log into portal
2. Click "Open" on the new app tile
3. Should redirect to app and be authenticated

## Security Considerations

1. **SSO Tokens**: Short-lived (5 minutes), single-use recommended
2. **Session Cookies**: HttpOnly, Secure, SameSite=Lax
3. **JWT Secret**: Must be at least 32 characters, kept secure
4. **Redirect Validation**: Apps should validate redirect URLs to prevent open redirects
5. **Audit Logging**: SSO issuance and exchanges are logged (basic)

## Troubleshooting

### "Access denied to this app"
- User doesn't have entry in `user_apps` table
- Check user's `user_id` matches `auth.users(id)`

### "Invalid SSO token"
- Token expired (5 min lifetime)
- `SSO_JWT_SECRET` doesn't match between portal and app
- Token was already used (if implementing single-use)

### "Failed to issue SSO token"
- User not authenticated in portal
- Database connection issue
- Check portal logs for details

## Portal Pages

- `/login` - Login page
- `/portal/apps` - Apps dashboard (lists accessible apps)
- `/portal/settings` - User settings and admin user management

## Environment Variables

### Portal
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `SSO_JWT_SECRET` - Secret for signing SSO tokens (min 32 chars)
- `PORTAL_DOMAIN` - Portal domain (for redirects)

### Apps
- `SSO_JWT_SECRET` - Must match portal's secret

## Multi-Tenant Support

If using multi-tenant (clients table):

1. Create clients in `clients` table
2. Link users to clients via `client_users`
3. Scope `user_apps` by `client_id`
4. RLS policies automatically filter by client

For single-tenant, leave `client_id` as NULL in `user_apps`.


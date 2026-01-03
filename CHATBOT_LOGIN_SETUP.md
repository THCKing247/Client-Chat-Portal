# Chatbot Login Portal Setup

The chatbot login portal has been integrated into the main site's client portal. This allows clients to access their AI Chatbot configuration and settings directly from the main site.

## Configuration

The chatbot login page requires Supabase credentials and the chatbot portal URL to be configured. You can set these in one of two ways:

### Option 1: Global Configuration (Recommended)

Add the following script to your main `index.html` or create a configuration file that loads before the chatbot login page:

```html
<script>
  // Set these before loading the chatbot login page
  window.CHATBOT_SUPABASE_URL = 'https://your-project.supabase.co';
  window.CHATBOT_SUPABASE_ANON_KEY = 'your-anon-key-here';
  window.CHATBOT_API_URL = 'https://api.apextsgroup.com'; // Your deployed API URL
  // IMPORTANT: Set this to your deployed Next.js chatbot portal URL
  // This is the URL that will be embedded in an iframe on /chatbot/portal/
  // Examples: 'https://chatbot.apextsgroup.com' or your Vercel/Netlify deployment URL
  window.CHATBOT_PORTAL_URL = 'https://chatbot.apextsgroup.com'; // Deployed Next.js portal URL
</script>
```

### Important: Chatbot Portal Deployment

The chatbot portal is a Next.js application located in `apex-chatbot/portal/`. It must be deployed online (not run locally):

1. **Deploy to Vercel (Recommended)**:
   - Push your code to GitHub
   - Import the `apex-chatbot/portal/` directory as a new Vercel project
   - Set environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_API_URL`
   - Vercel will provide a deployment URL (e.g., `https://your-portal.vercel.app`)
   - Optionally configure a custom domain (e.g., `chatbot.apextsgroup.com`)

2. **Deploy to Netlify**:
   - Similar process - connect GitHub repo and deploy
   - Set the same environment variables
   - Configure custom domain if desired

3. **Update Configuration**:
   - Set `CHATBOT_PORTAL_URL` to your deployed portal URL
   - Make sure the portal is publicly accessible

### Session Tunnel Setup

The portal is embedded in an iframe on the main site. To handle authentication, you need to update the Next.js portal to receive the session via postMessage. See `apex-chatbot/portal/SESSION_TUNNEL_SETUP.md` for detailed instructions.

### Option 2: Environment Variables (For Server-Side)

If you're using a build process, you can set these as environment variables and inject them during build.

## Features

The chatbot login portal includes:

1. **Email/Password Login** - Standard authentication using Supabase Auth
2. **Password Reset Flow** - For users who need to reset their password
3. **Required Password Reset** - Handles users who must reset their password on first login
4. **Account Lock Detection** - Prevents login for locked accounts
5. **Session Management** - Automatically checks for existing sessions
6. **Forgot Password** - Allows users to request password reset emails

## Integration Points

### Dashboard Integration

The chatbot login is accessible from the client portal dashboard:

- **Login Location**: `/chatbot/login/`
- **Portal Location**: `/chatbot/portal/` (embedded chatbot portal)
- **Linked from**: Dashboard → Your Assets → AI Chatbot → "Access Portal" button
- **Breadcrumb**: Home → Dashboard → AI Chatbot Login → Chatbot Portal

### API Endpoints Required

The login portal expects the following API endpoints to be available:

- `POST /auth/clear-password-reset-flag` - Clears the `must_reset_password` flag after password reset

Make sure your API server (from `apex-chatbot/api`) is running and accessible at the configured `CHATBOT_API_URL`.

## Usage

1. Clients access the chatbot login from their dashboard
2. They enter their email and password
3. If password reset is required, they'll be prompted to set a new password
4. After successful login, they're redirected to `/chatbot/portal/` on the main site
5. The portal page embeds the Next.js chatbot portal in an iframe
6. The session is passed to the embedded portal, keeping users on the main site

## Security Notes

- The Supabase anon key is safe to expose in client-side code (it's designed for this)
- All authentication is handled by Supabase Auth
- The API endpoints require Bearer tokens for authenticated requests
- Account locking and password reset flags are enforced server-side

## Troubleshooting

### "Configuration error: Supabase credentials not set"

Make sure you've set `CHATBOT_SUPABASE_URL` and `CHATBOT_SUPABASE_ANON_KEY` before the page loads.

### "Failed to initialize authentication system"

Check that your Supabase URL and anon key are correct and valid.

### "Endpoint not found" errors

Ensure your API server is running and accessible at the configured `CHATBOT_API_URL`.

### Redirect issues

Verify that `CHATBOT_REDIRECT_URL` points to your chatbot portal:
- **Local**: `http://localhost:3000` (make sure the Next.js dev server is running)
- **Production**: Your deployed portal URL (e.g., `https://chatbot.apextsgroup.com`)

### 404 Error for chatbot portal

If you see a 404 when loading the chatbot portal:
1. **Verify deployment**: Check that the portal is deployed and accessible at the URL in `CHATBOT_PORTAL_URL`
2. **Check URL configuration**: Make sure `CHATBOT_PORTAL_URL` is set correctly (no localhost URLs)
3. **Test portal directly**: Try accessing the portal URL directly in your browser to verify it's working
4. **Domain configuration**: If using a custom domain, ensure DNS is properly configured and pointing to your deployment
5. **Deployment status**: Check your deployment platform (Vercel/Netlify) to ensure the deployment succeeded


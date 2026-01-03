# Deployment Guide - Chatbot Portal

This guide explains how to deploy the Next.js chatbot portal so it's accessible online (not via localhost).

## Quick Start: Deploy to Vercel

### Step 1: Prepare Your Repository

1. Make sure your `apex-chatbot/portal/` code is committed to GitHub
2. The portal should be in its own directory or repository

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your repository
4. **Important**: Set the root directory to `apex-chatbot/portal` (or wherever your Next.js app is)
5. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `NEXT_PUBLIC_API_URL` - Your API server URL (e.g., `https://api.apextsgroup.com`)
6. Click "Deploy"

### Step 3: Get Your Deployment URL

After deployment, Vercel will provide a URL like:
- `https://your-portal-abc123.vercel.app`

Or if you configure a custom domain:
- `https://chatbot.apextsgroup.com`

### Step 4: Update Main Site Configuration

Add this to your main site's configuration (in `index.html` or a config file):

```html
<script>
  window.CHATBOT_PORTAL_URL = 'https://your-portal-abc123.vercel.app';
  // Or if using custom domain:
  // window.CHATBOT_PORTAL_URL = 'https://chatbot.apextsgroup.com';
</script>
```

## Alternative: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. Click "Add new site" → "Import an existing project"
3. Select your repository
4. Set build settings:
   - **Base directory**: `apex-chatbot/portal`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next` (or leave default)
5. Add environment variables (same as Vercel)
6. Deploy

## Alternative: Deploy to GitHub Pages

Note: GitHub Pages requires static export. You'll need to configure Next.js for static export:

1. Update `next.config.ts`:
```typescript
export default {
  output: 'export',
  // ... other config
}
```

2. Build and deploy:
```bash
cd apex-chatbot/portal
npm run build
# Deploy the 'out' directory to GitHub Pages
```

## Verify Deployment

1. Visit your deployed URL directly in a browser
2. You should see the chatbot portal login page
3. If it loads, the deployment is successful

## Update Main Site

Once deployed, update your main site configuration:

```html
<script>
  window.CHATBOT_SUPABASE_URL = 'https://your-project.supabase.co';
  window.CHATBOT_SUPABASE_ANON_KEY = 'your-anon-key';
  window.CHATBOT_API_URL = 'https://api.apextsgroup.com';
  window.CHATBOT_PORTAL_URL = 'https://your-deployed-portal-url.com';
</script>
```

## Troubleshooting

### Portal shows 404
- Verify the deployment URL is correct
- Check that the deployment succeeded (no build errors)
- Ensure environment variables are set correctly

### CORS errors
- Make sure your API server allows requests from your portal domain
- Check API CORS configuration

### Authentication not working
- Verify Supabase environment variables are set correctly
- Check that the API URL is accessible and correct


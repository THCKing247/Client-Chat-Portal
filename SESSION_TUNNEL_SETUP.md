# Session Tunnel Setup for Main Site Integration

The chatbot portal can now be embedded in the main site. When accessed from the main site, the session is passed via postMessage to maintain authentication.

## How It Works

1. User logs in on the main site at `/chatbot/login/`
2. After successful login, user is redirected to `/chatbot/portal/` on the main site
3. The portal page embeds the Next.js chatbot portal in an iframe
4. The session token is passed to the iframe via postMessage
5. The Next.js portal receives the session and initializes Supabase

## Required Changes to Next.js Portal

Add this code to your Next.js portal to handle the session tunnel:

### 1. Update `app/page.tsx` or create a session handler

Add this to your main page component or create a separate hook:

```typescript
// Add this useEffect to handle session from parent window
useEffect(() => {
  // Listen for session from parent window (main site)
  const handleMessage = async (event: MessageEvent) => {
    // Verify origin for security (update with your main site domain)
    if (event.origin !== 'https://apextsgroup.com' && 
        event.origin !== 'http://localhost:8000') {
      return; // Ignore messages from unknown origins
    }

    if (event.data.type === 'SUPABASE_SESSION') {
      const { session, supabaseUrl, supabaseAnonKey } = event.data;
      
      // Initialize Supabase with the session
      if (session && session.access_token) {
        // Set the session in Supabase client
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token || '',
        });
        
        // Refresh user data
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
      }
    }
  };

  window.addEventListener('message', handleMessage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}, []);
```

### 2. Alternative: Use URL Parameters (Less Secure)

If postMessage doesn't work due to cross-origin restrictions, you can pass the token via URL (less secure, but works):

In the main site's `chatbot/portal/index.html`, change:
```javascript
iframe.src = portalUrl + '?token=' + encodeURIComponent(accessToken);
```

Then in the Next.js portal, read it:
```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // You may need to store this separately
    });
  }
}, []);
```

### 3. Recommended: Shared Supabase Session (Best for Same Domain)

If the Next.js portal is on the same domain (or subdomain with shared cookies), the Supabase session should automatically be shared. In this case, no special handling is needed - the portal will automatically detect the session.

## Configuration

Update the main site configuration to point to your portal:

```html
<script>
  window.CHATBOT_SUPABASE_URL = 'https://your-project.supabase.co';
  window.CHATBOT_SUPABASE_ANON_KEY = 'your-anon-key';
  window.CHATBOT_PORTAL_URL = 'http://localhost:3000'; // Local development
  // Or for production:
  // window.CHATBOT_PORTAL_URL = 'https://chatbot.apextsgroup.com';
</script>
```

## Security Considerations

1. **Origin Verification**: Always verify the `event.origin` in postMessage handlers
2. **Token Storage**: Don't store tokens in localStorage if using URL parameters
3. **HTTPS**: Use HTTPS in production to protect tokens in transit
4. **Same-Origin**: If possible, host both sites on the same domain to avoid cross-origin issues

## Testing

1. Start your Next.js portal: `npm run dev` (runs on http://localhost:3000)
2. Configure main site to point to `http://localhost:3000`
3. Login at `/chatbot/login/` on main site
4. Should redirect to `/chatbot/portal/` which embeds the portal
5. Portal should load with authenticated session


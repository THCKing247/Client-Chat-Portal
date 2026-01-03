# Chat App SSO Integration

This directory contains the SSO handler for the Chat app (`chat.apextsgroup.com`).

## Setup

1. Copy `sso-handler.js` to your chat app's backend directory
2. Install dependencies:
   ```bash
   npm install jsonwebtoken
   ```
3. Set environment variable:
   ```
   SSO_JWT_SECRET=your-secret-key-must-match-portal
   ```

## Integration Examples

### Express.js

```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const { exchangeSSOToken, requireAppAuth, SESSION_COOKIE_NAME } = require('./sso-handler');

const app = express();
app.use(cookieParser());

// SSO exchange route
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

// Protect routes
app.use('/api', requireAppAuth);
app.use('/dashboard', requireAppAuth);

// Access user in routes
app.get('/api/user', requireAppAuth, (req, res) => {
  res.json({ user: req.user });
});
```

### Next.js API Route

```typescript
// app/sso/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exchangeSSOToken, SESSION_COOKIE_NAME } from '@/lib/sso-handler';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.redirect('https://portal.apextsgroup.com/login');
  }
  
  const result = await exchangeSSOToken(token);
  
  if (result.error) {
    return NextResponse.redirect('https://portal.apextsgroup.com/login');
  }
  
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set(SESSION_COOKIE_NAME, result.sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60
  });
  
  return response;
}
```

### Fastify

```javascript
const fastify = require('fastify');
const { exchangeSSOToken, requireAppAuth, SESSION_COOKIE_NAME } = require('./sso-handler');

const app = fastify();

// SSO exchange route
app.get('/sso', async (request, reply) => {
  const token = request.query.token;
  const result = await exchangeSSOToken(token);
  
  if (result.error) {
    return reply.redirect('https://portal.apextsgroup.com/login?redirect=' + encodeURIComponent(request.url));
  }
  
  reply.setCookie(SESSION_COOKIE_NAME, result.sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60
  });
  
  return reply.redirect('/');
});

// Auth guard plugin
async function authGuard(request, reply) {
  const sessionToken = request.cookies[SESSION_COOKIE_NAME];
  const result = verifyAppSession(sessionToken);
  
  if (!result.valid) {
    return reply.redirect('https://portal.apextsgroup.com/login?redirect=' + encodeURIComponent(request.url));
  }
  
  request.user = result.user;
}

// Use guard
app.register(async function (fastify) {
  fastify.addHook('onRequest', authGuard);
  // Protected routes here
});
```

## Security Notes

- SSO tokens are short-lived (5 minutes)
- Session cookies are HttpOnly and Secure
- Always validate redirect URLs to prevent open redirect attacks
- Log SSO exchanges for audit purposes


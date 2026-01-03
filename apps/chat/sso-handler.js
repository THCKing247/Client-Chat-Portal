/**
 * SSO Token Exchange Handler for Chat App
 * 
 * This file should be integrated into your chat app's backend.
 * Example for Express/Fastify/Next.js API route.
 */

const jwt = require('jsonwebtoken');

const SSO_JWT_SECRET = process.env.SSO_JWT_SECRET; // Must match portal's secret
const SESSION_COOKIE_NAME = 'app_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Exchange SSO token for app session
 * 
 * Usage in Express:
 * app.get('/sso', async (req, res) => {
 *   const token = req.query.token;
 *   const result = await exchangeSSOToken(token);
 *   if (result.error) {
 *     return res.redirect('https://portal.apextsgroup.com/login?redirect=' + encodeURIComponent(req.url));
 *   }
 *   res.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
 *     httpOnly: true,
 *     secure: true,
 *     sameSite: 'lax',
 *     maxAge: SESSION_MAX_AGE * 1000
 *   });
 *   res.redirect('/');
 * });
 */
async function exchangeSSOToken(ssoToken) {
  if (!ssoToken) {
    return { error: 'Missing SSO token' };
  }

  try {
    // Verify and decode SSO token
    const payload = jwt.verify(ssoToken, SSO_JWT_SECRET, { algorithms: ['HS256'] });
    
    // Validate token hasn't expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { error: 'SSO token expired' };
    }

    // Log SSO exchange (basic audit)
    console.log(`[SSO] Exchanged token for user ${payload.user_id} to app ${payload.app_slug} at ${new Date().toISOString()}`);

    // Create app session token (you can use JWT or session ID)
    const sessionToken = jwt.sign(
      {
        user_id: payload.user_id,
        client_id: payload.client_id,
        app_slug: payload.app_slug,
        role: payload.role,
        iat: now,
        exp: now + SESSION_MAX_AGE
      },
      SSO_JWT_SECRET, // Or use a different secret for app sessions
      { algorithm: 'HS256' }
    );

    return {
      sessionToken,
      user: {
        id: payload.user_id,
        clientId: payload.client_id,
        appSlug: payload.app_slug,
        role: payload.role
      }
    };
  } catch (error) {
    console.error('SSO token exchange error:', error);
    return { error: 'Invalid SSO token' };
  }
}

/**
 * Verify app session token
 */
function verifyAppSession(sessionToken) {
  try {
    const payload = jwt.verify(sessionToken, SSO_JWT_SECRET, { algorithms: ['HS256'] });
    return { valid: true, user: payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Auth guard middleware
 * 
 * Usage in Express:
 * app.use('/api/*', requireAppAuth);
 * 
 * function requireAppAuth(req, res, next) {
 *   const sessionToken = req.cookies[SESSION_COOKIE_NAME];
 *   const result = verifyAppSession(sessionToken);
 *   if (!result.valid) {
 *     return res.redirect('https://portal.apextsgroup.com/login?redirect=' + encodeURIComponent(req.originalUrl));
 *   }
 *   req.user = result.user;
 *   next();
 * }
 */
function requireAppAuth(req, res, next) {
  const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
  
  if (!sessionToken) {
    const redirectUrl = `https://portal.apextsgroup.com/login?redirect=${encodeURIComponent(req.originalUrl)}`;
    return res.redirect(302, redirectUrl);
  }

  const result = verifyAppSession(sessionToken);
  if (!result.valid) {
    const redirectUrl = `https://portal.apextsgroup.com/login?redirect=${encodeURIComponent(req.originalUrl)}`;
    return res.redirect(302, redirectUrl);
  }

  req.user = result.user;
  next();
}

module.exports = {
  exchangeSSOToken,
  verifyAppSession,
  requireAppAuth,
  SESSION_COOKIE_NAME
};


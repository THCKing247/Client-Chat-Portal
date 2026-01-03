/**
 * SSO Token Exchange Handler for DC App
 * 
 * This file should be integrated into your DC app's backend.
 * Same implementation as chat app - copy and adapt as needed.
 */

const jwt = require('jsonwebtoken');

const SSO_JWT_SECRET = process.env.SSO_JWT_SECRET; // Must match portal's secret
const SESSION_COOKIE_NAME = 'app_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function exchangeSSOToken(ssoToken) {
  if (!ssoToken) {
    return { error: 'Missing SSO token' };
  }

  try {
    const payload = jwt.verify(ssoToken, SSO_JWT_SECRET, { algorithms: ['HS256'] });
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { error: 'SSO token expired' };
    }

    console.log(`[SSO] Exchanged token for user ${payload.user_id} to app ${payload.app_slug} at ${new Date().toISOString()}`);

    const sessionToken = jwt.sign(
      {
        user_id: payload.user_id,
        client_id: payload.client_id,
        app_slug: payload.app_slug,
        role: payload.role,
        iat: now,
        exp: now + SESSION_MAX_AGE
      },
      SSO_JWT_SECRET,
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

function verifyAppSession(sessionToken) {
  try {
    const payload = jwt.verify(sessionToken, SSO_JWT_SECRET, { algorithms: ['HS256'] });
    return { valid: true, user: payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

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


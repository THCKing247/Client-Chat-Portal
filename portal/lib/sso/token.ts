import jwt from 'jsonwebtoken'

export interface SSOTokenPayload {
  user_id: string
  client_id?: string
  app_slug: string
  role: string
  iat: number
  exp: number
}

const JWT_SECRET = process.env.SSO_JWT_SECRET!
const TOKEN_EXPIRY = 5 * 60 // 5 minutes in seconds

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('SSO_JWT_SECRET must be at least 32 characters')
}

/**
 * Issue a short-lived SSO token for app access
 */
export function issueSSOToken(
  userId: string,
  appSlug: string,
  role: string,
  clientId?: string
): string {
  const payload: SSOTokenPayload = {
    user_id: userId,
    client_id: clientId,
    app_slug: appSlug,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY
  }

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' })
}

/**
 * Verify and decode an SSO token
 */
export function verifySSOToken(token: string): SSOTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as SSOTokenPayload
    return decoded
  } catch (error) {
    return null
  }
}


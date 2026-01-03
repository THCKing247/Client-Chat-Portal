import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'

export interface AuthUser {
  id: string
  email: string
  clientId?: string
  role?: string
}

/**
 * Require user to be authenticated (portal)
 * Returns user info or redirects to login
 */
export async function requirePortalUser(): Promise<AuthUser> {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login?redirect=' + encodeURIComponent('/'))
  }

  // Get client info if multi-tenant
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('client_id, role')
    .eq('user_id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    clientId: clientUser?.client_id,
    role: clientUser?.role || 'user'
  }
}

/**
 * Check if user has access to a specific app
 */
export async function hasAppAccess(userId: string, appSlug: string, clientId?: string): Promise<boolean> {
  const supabase = createSupabaseServerClient()
  
  // First get the app ID
  const { data: app } = await supabase
    .from('apps')
    .select('id')
    .eq('slug', appSlug)
    .single()

  if (!app) return false

  // Then check user_apps
  let query = supabase
    .from('user_apps')
    .select('id')
    .eq('user_id', userId)
    .eq('app_id', app.id)

  if (clientId) {
    query = query.eq('client_id', clientId)
  } else {
    query = query.is('client_id', null)
  }

  const { data, error } = await query.maybeSingle()
  return !error && !!data
}

/**
 * Get user's role for a specific app
 */
export async function getUserRoleForApp(userId: string, appSlug: string, clientId?: string): Promise<string | null> {
  const supabase = createSupabaseServerClient()
  
  const { data: app } = await supabase
    .from('apps')
    .select('id')
    .eq('slug', appSlug)
    .single()

  if (!app) return null

  let query = supabase
    .from('user_apps')
    .select('role')
    .eq('user_id', userId)
    .eq('app_id', app.id)

  if (clientId) {
    query = query.eq('client_id', clientId)
  } else {
    query = query.is('client_id', null)
  }

  const { data, error } = await query.maybeSingle()
  return error || !data ? null : data.role
}

/**
 * Middleware for Next.js App Router
 * Protects routes and handles auth redirects
 */
export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Allow public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Check auth for protected routes
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && pathname.startsWith('/portal')) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}


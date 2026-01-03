import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePortalUser, hasAppAccess, getUserRoleForApp } from '@/lib/auth/middleware'
import { issueSSOToken } from '@/lib/sso/token'

export async function POST(request: NextRequest) {
  try {
    const user = await requirePortalUser()
    const searchParams = request.nextUrl.searchParams
    const appSlug = searchParams.get('app')

    if (!appSlug) {
      return NextResponse.json(
        { error: 'App slug is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this app
    const hasAccess = await hasAppAccess(user.id, appSlug, user.clientId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this app' },
        { status: 403 }
      )
    }

    // Get user's role for this app
    const role = await getUserRoleForApp(user.id, appSlug, user.clientId) || 'user'

    // Issue SSO token
    const token = issueSSOToken(user.id, appSlug, role, user.clientId)

    // Log SSO issuance (basic audit)
    console.log(`[SSO] Issued token for user ${user.id} to app ${appSlug} at ${new Date().toISOString()}`)

    return NextResponse.json({ token })
  } catch (error: any) {
    console.error('SSO issuance error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to issue SSO token' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requirePortalUser()
    
    // Check if user is admin
    const supabase = createSupabaseServerClient()
    const { data: clientUser } = await supabase
      .from('client_users')
      .select('role, client_id')
      .eq('user_id', user.id)
      .single()

    const isAdmin = clientUser?.role === 'admin' || !clientUser
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { email, appIds } = await request.json()

    if (!email || !Array.isArray(appIds)) {
      return NextResponse.json(
        { error: 'Email and appIds array are required' },
        { status: 400 }
      )
    }

    // Use admin client to create user and grant access
    const admin = createSupabaseAdmin()

    // Check if user already exists
    const { data: existingUser } = await admin.auth.admin.getUserByEmail(email)
    
    let userId: string
    if (existingUser?.user) {
      userId = existingUser.user.id
    } else {
      // Create new user (they'll need to set password via email)
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        // Password will be set via email invite
      })

      if (createError || !newUser.user) {
        return NextResponse.json(
          { error: createError?.message || 'Failed to create user' },
          { status: 500 }
        )
      }

      userId = newUser.user.id

      // Add to client_users if multi-tenant
      if (clientUser?.client_id) {
        await admin
          .from('client_users')
          .insert({
            user_id: userId,
            client_id: clientUser.client_id,
            role: 'user'
          })
      }
    }

    // Grant app access
    if (appIds.length > 0) {
      const userAppEntries = appIds.map((appId: string) => ({
        user_id: userId,
        app_id: appId,
        client_id: clientUser?.client_id || null,
        role: 'user'
      }))

      // Remove existing entries first
      await admin
        .from('user_apps')
        .delete()
        .eq('user_id', userId)
        .in('app_id', appIds)

      // Insert new entries
      const { error: insertError } = await admin
        .from('user_apps')
        .insert(userAppEntries)

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to grant app access' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, userId })
  } catch (error: any) {
    console.error('Invite user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to invite user' },
      { status: 500 }
    )
  }
}


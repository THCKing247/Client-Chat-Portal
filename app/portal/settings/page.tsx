import { requirePortalUser } from '@/lib/auth/middleware'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const user = await requirePortalUser()
  const supabase = createSupabaseServerClient()

  // Check if user is admin
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('role, clients:client_id (id, name)')
    .eq('user_id', user.id)
    .single()

  const isAdmin = clientUser?.role === 'admin' || !clientUser // Allow if no client_users (single-tenant admin)

  // Get all apps for admin
  let allApps: any[] = []
  if (isAdmin) {
    const { data } = await supabase
      .from('apps')
      .select('*')
      .order('name')
    allApps = data || []
  }

  // Get user's accessible apps
  const { data: userApps } = await supabase
    .from('user_apps')
    .select(`
      app_id,
      role,
      apps:app_id (
        id,
        slug,
        name
      )
    `)
    .eq('user_id', user.id)

  const accessibleApps = userApps?.map((ua: any) => ({
    id: ua.apps.id,
    slug: ua.apps.slug,
    name: ua.apps.name,
    role: ua.role
  })) || []

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e0e0e0',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              marginBottom: '8px',
              fontWeight: '600'
            }}>User Settings</h1>
            <p style={{
              color: '#999',
              fontSize: '16px'
            }}>Manage your account and app access</p>
          </div>
          <a
            href="/portal/apps"
            style={{
              padding: '10px 20px',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Back to Apps
          </a>
        </div>

        <SettingsClient
          user={user}
          isAdmin={isAdmin}
          allApps={allApps}
          accessibleApps={accessibleApps}
          clientName={clientUser?.clients?.name}
        />
      </div>
    </div>
  )
}


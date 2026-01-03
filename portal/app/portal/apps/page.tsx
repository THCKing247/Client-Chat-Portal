import { requirePortalUser, hasAppAccess } from '@/lib/auth/middleware'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppsClient from './apps-client'

export default async function AppsPage() {
  const user = await requirePortalUser()
  const supabase = createSupabaseServerClient()

  // Get all apps
  const { data: allApps } = await supabase
    .from('apps')
    .select('*')
    .order('name')

  // Get user's accessible apps
  const { data: userApps } = await supabase
    .from('user_apps')
    .select(`
      app_id,
      role,
      apps:app_id (
        id,
        slug,
        name,
        domain
      )
    `)
    .eq('user_id', user.id)

  const accessibleApps = userApps?.map((ua: any) => ({
    id: ua.apps.id,
    slug: ua.apps.slug,
    name: ua.apps.name,
    domain: ua.apps.domain,
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
        maxWidth: '1200px',
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
            }}>Your Apps</h1>
            <p style={{
              color: '#999',
              fontSize: '16px'
            }}>Access your authorized applications</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a
              href="/portal/settings"
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
              Settings
            </a>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#2a2a2a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {accessibleApps.length === 0 ? (
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '60px',
            textAlign: 'center',
            border: '1px solid #2a2a2a'
          }}>
            <p style={{
              color: '#999',
              fontSize: '16px',
              marginBottom: '20px'
            }}>You don't have access to any apps yet.</p>
            <p style={{
              color: '#666',
              fontSize: '14px'
            }}>Contact your administrator to grant access.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <AppsClient apps={accessibleApps} />
          </div>
        )}
      </div>
    </div>
  )
}


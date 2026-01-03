'use client'

import { useState } from 'react'

interface User {
  id: string
  email: string
  clientId?: string
  role?: string
}

interface App {
  id: string
  slug: string
  name: string
}

export default function SettingsClient({
  user,
  isAdmin,
  allApps,
  accessibleApps,
  clientName
}: {
  user: User
  isAdmin: boolean
  allApps: App[]
  accessibleApps: Array<App & { role: string }>
  clientName?: string
}) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedApps, setSelectedApps] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          appIds: Object.keys(selectedApps).filter(id => selectedApps[id])
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user')
      }

      setMessage({ type: 'success', text: 'User invited successfully!' })
      setInviteEmail('')
      setSelectedApps({})
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const toggleApp = (appId: string) => {
    setSelectedApps(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* User Profile */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '32px',
        border: '1px solid #2a2a2a'
      }}>
        <h2 style={{
          fontSize: '24px',
          marginBottom: '24px',
          fontWeight: '600'
        }}>Your Profile</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#999',
              fontSize: '14px'
            }}>Email</label>
            <div style={{
              padding: '12px',
              background: '#2a2a2a',
              borderRadius: '8px',
              color: '#fff'
            }}>{user.email}</div>
          </div>
          {clientName && (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#999',
                fontSize: '14px'
              }}>Client</label>
              <div style={{
                padding: '12px',
                background: '#2a2a2a',
                borderRadius: '8px',
                color: '#fff'
              }}>{clientName}</div>
            </div>
          )}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#999',
              fontSize: '14px'
            }}>Role</label>
            <div style={{
              padding: '12px',
              background: '#2a2a2a',
              borderRadius: '8px',
              color: '#fff'
            }}>{user.role || 'user'}</div>
          </div>
        </div>
      </div>

      {/* Your App Access */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '32px',
        border: '1px solid #2a2a2a'
      }}>
        <h2 style={{
          fontSize: '24px',
          marginBottom: '24px',
          fontWeight: '600'
        }}>Your App Access</h2>
        {accessibleApps.length === 0 ? (
          <p style={{ color: '#999' }}>You don't have access to any apps.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {accessibleApps.map((app) => (
              <div
                key={app.id}
                style={{
                  padding: '16px',
                  background: '#2a2a2a',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>{app.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>Role: {app.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin: Invite Users */}
      {isAdmin && (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '32px',
          border: '1px solid #2a2a2a'
        }}>
          <h2 style={{
            fontSize: '24px',
            marginBottom: '24px',
            fontWeight: '600'
          }}>Invite User</h2>

          {message && (
            <div style={{
              padding: '12px',
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '8px',
              marginBottom: '20px',
              color: message.type === 'success' ? '#86efac' : '#fca5a5'
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleInviteUser}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#ccc',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2a2a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px'
                }}
                placeholder="user@example.com"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                color: '#ccc',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Grant Access To Apps
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allApps.map((app) => (
                  <label
                    key={app.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: '#2a2a2a',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedApps[app.id] || false}
                      onChange={() => toggleApp(app.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span>{app.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? '#555' : '#667eea',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Inviting...' : 'Invite User'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}


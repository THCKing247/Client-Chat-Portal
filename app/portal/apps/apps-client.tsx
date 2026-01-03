'use client'

import { useState } from 'react'

interface App {
  id: string
  slug: string
  name: string
  domain: string
  role: string
}

export default function AppsClient({ apps }: { apps: App[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleOpenApp = async (app: App) => {
    setLoading(app.slug)
    try {
      // Request SSO token from portal
      const response = await fetch(`/api/sso/issue?app=${app.slug}`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to get SSO token')
      }

      const data = await response.json()
      const ssoUrl = `https://${app.domain}/sso?token=${data.token}`
      
      // Redirect to app with SSO token
      window.location.href = ssoUrl
    } catch (error) {
      console.error('Error opening app:', error)
      alert('Failed to open app. Please try again.')
      setLoading(null)
    }
  }

  return (
    <>
      {apps.map((app) => (
        <div
          key={app.id}
          style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '32px',
            border: '1px solid #2a2a2a',
            transition: 'all 0.2s',
            cursor: 'pointer',
            position: 'relative'
          }}
          onClick={() => handleOpenApp(app)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#667eea'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a2a2a'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>🚀</div>
          <h3 style={{
            fontSize: '20px',
            marginBottom: '8px',
            fontWeight: '600'
          }}>{app.name}</h3>
          <p style={{
            color: '#999',
            fontSize: '14px',
            marginBottom: '20px'
          }}>{app.domain}</p>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '12px',
              color: '#667eea',
              background: 'rgba(102, 126, 234, 0.1)',
              padding: '4px 12px',
              borderRadius: '12px'
            }}>
              {app.role}
            </span>
            <button
              disabled={loading === app.slug}
              style={{
                padding: '8px 20px',
                background: loading === app.slug ? '#555' : '#667eea',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading === app.slug ? 'not-allowed' : 'pointer'
              }}
            >
              {loading === app.slug ? 'Opening...' : 'Open'}
            </button>
          </div>
        </div>
      ))}
    </>
  )
}


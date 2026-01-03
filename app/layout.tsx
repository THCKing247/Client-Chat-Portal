import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Client Portal | Apex Technical Solutions Group',
  description: 'Access your apps and manage your account',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


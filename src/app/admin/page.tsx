import type { Metadata } from 'next'
import { requireModerator } from '@/lib/dal/auth'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const user = await requireModerator()

  return (
    <div>
      <h1 id="admin-dashboard-heading" style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: '0.5rem' }}>
        Admin Dashboard
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Signed in as <strong>{user.email}</strong> — role: <strong>{user.role}</strong>
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {quickLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              display: 'block',
              padding: '1.25rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              textDecoration: 'none',
              color: 'var(--foreground)',
            }}
          >
            <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }} aria-hidden="true">{link.icon}</p>
            <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>{link.label}</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>{link.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

const quickLinks = [
  { href: '/admin/stores', icon: '🏪', label: 'Stores', description: 'Review pending store submissions' },
  { href: '/admin/products', icon: '📦', label: 'Products', description: 'Manage the product catalog' },
  { href: '/admin/reports', icon: '📋', label: 'Price Reports', description: 'Review community price reports' },
  { href: '/admin/photos', icon: '🖼️', label: 'Photos', description: 'Moderate photo uploads' },
]

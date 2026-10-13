import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/dal/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    redirect('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      {/* Sidebar nav */}
      <nav
        aria-label="Admin navigation"
        style={{
          width: '220px',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}
      >
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem',
          }}
        >
          Admin — {user.role}
        </p>
        {adminLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              display: 'block',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--foreground)',
              textDecoration: 'none',
            }}
          >
            {link.icon} {link.label}
          </a>
        ))}
      </nav>

      {/* Main content */}
      <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

const adminLinks = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/stores', icon: '🏪', label: 'Stores' },
  { href: '/admin/products', icon: '📦', label: 'Products' },
  { href: '/admin/reports', icon: '📋', label: 'Price Reports' },
  { href: '/admin/photos', icon: '🖼️', label: 'Photos' },
]

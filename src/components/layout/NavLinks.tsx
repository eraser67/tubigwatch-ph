'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/map', label: 'Map' },
  { href: '/stores', label: 'Stores' },
  { href: '/compare', label: 'Compare' },
  { href: '/contribute', label: 'Add a Store' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary navigation" style={{ display: 'flex', gap: '0.25rem' }}>
      {navLinks.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--color-brand-600)' : 'var(--foreground)',
              backgroundColor: isActive ? 'var(--muted-background)' : 'transparent',
              textDecoration: 'none',
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

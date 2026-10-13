import { Suspense } from 'react'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'
import { NavLinks } from './NavLinks'

export function SiteHeader() {
  return (
    <>
      {/* Skip-to-content for keyboard / screen-reader users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header
        role="banner"
        style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            gap: '1.5rem',
          }}
        >
          {/* Logo / wordmark */}
          <Link
            href="/"
            aria-label={`${APP_NAME} home`}
            style={{
              fontWeight: 700,
              fontSize: '1.125rem',
              color: 'var(--color-brand-600)',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              flexShrink: 0,
            }}
          >
            💧 {APP_NAME}
          </Link>

          {/* Client component handles active state + hover — wrapped in Suspense for PPR */}
          <Suspense fallback={<nav aria-label="Primary navigation" style={{ display: 'flex', gap: '0.25rem' }} />}>
            <NavLinks />
          </Suspense>
        </div>
      </header>
    </>
  )
}

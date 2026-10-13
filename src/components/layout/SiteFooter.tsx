import { APP_NAME } from '@/lib/constants'

// Static year — acceptable for a copyright notice; update annually or switch to 'use client' if dynamic year is needed.
const CURRENT_YEAR = 2026

export function SiteFooter() {
  return (
    <footer
      role="contentinfo"
      style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        padding: '1.5rem 1rem',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: 'var(--muted)',
        }}
      >
        <p>
          © {CURRENT_YEAR} {APP_NAME} — Community-powered water supply finder.
        </p>
        <p>
          Map data{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-brand-500)', textDecoration: 'underline' }}
          >
            © OpenStreetMap contributors
          </a>
          {' · '}
          Tiles by{' '}
          <a
            href="https://stadiamaps.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-brand-500)', textDecoration: 'underline' }}
          >
            Stadia Maps
          </a>
        </p>
      </div>
    </footer>
  )
}

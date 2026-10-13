import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found',
}

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '3rem' }} aria-hidden="true">💧</span>
      <h1 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem' }}>Page not found</h1>
      <p style={{ margin: 0, color: 'var(--muted)', maxWidth: '400px' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        id="not-found-home-link"
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1.25rem',
          backgroundColor: 'var(--color-brand-600)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '0.9rem',
        }}
      >
        Return home
      </Link>
    </div>
  )
}

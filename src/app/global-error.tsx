'use client'

import { PageError } from '@/components/feedback/ErrorState'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <PageError error={error} reset={reset} />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { requireModerator } from '@/lib/dal/auth'
import { EmptyState } from '@/components/feedback/EmptyState'

export const metadata: Metadata = { title: 'Photo Moderation' }

export default async function AdminPhotosPage() {
  await requireModerator()

  return (
    <div>
      <h1 id="admin-photos-heading" style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: '1.5rem' }}>
        Photo Moderation
      </h1>
      <EmptyState
        icon="🖼️"
        title="Photo moderation UI coming in Phase 3 completion"
        message="Photo upload and review is implemented server-side. The moderation UI will be built alongside store/product forms in Phase 5."
      />
    </div>
  )
}

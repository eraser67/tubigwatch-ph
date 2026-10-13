import type { Metadata } from 'next'
import { requireModerator } from '@/lib/dal/auth'
import { getCategories, getProducts } from '@/lib/dal/products'
import { createProductAction } from '@/app/actions/products'

export const metadata: Metadata = { title: 'Product Management' }

export default async function AdminProductsPage() {
  await requireModerator()

  const [categories, products] = await Promise.all([getCategories(), getProducts()])

  return (
    <div>
      <h1 id="admin-products-heading" style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: '1.5rem' }}>
        Product Catalog
      </h1>

      {/* Add product form */}
      <section aria-labelledby="add-product-heading" style={{ marginBottom: '2.5rem' }}>
        <h2
          id="add-product-heading"
          style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', color: 'var(--muted)' }}
        >
          Add Product
        </h2>
        <form
          action={async (formData: FormData) => { await createProductAction(formData) }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            padding: '1.25rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div>
            <label htmlFor="product-category" style={labelStyle}>Category *</label>
            <select id="product-category" name="category_id" required style={inputStyle}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="product-name" style={labelStyle}>Name *</label>
            <input id="product-name" name="name" required minLength={2} maxLength={120} style={inputStyle} placeholder="e.g. Round Water Bucket" />
          </div>
          <div>
            <label htmlFor="product-brand" style={labelStyle}>Brand</label>
            <input id="product-brand" name="brand" maxLength={100} style={inputStyle} placeholder="Optional" />
          </div>
          <div>
            <label htmlFor="product-capacity" style={labelStyle}>Capacity (liters)</label>
            <input id="product-capacity" name="capacity_liters" type="number" min="0.1" step="0.1" style={inputStyle} placeholder="e.g. 20" />
          </div>
          <div>
            <label htmlFor="product-material" style={labelStyle}>Material</label>
            <input id="product-material" name="material" maxLength={80} style={inputStyle} placeholder="e.g. HDPE Plastic" />
          </div>
          <div>
            <label htmlFor="product-dimensions" style={labelStyle}>Dimensions (cm)</label>
            <input id="product-dimensions" name="dimensions_cm" maxLength={60} style={inputStyle} placeholder="e.g. 30 x 40" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="product-description" style={labelStyle}>Description</label>
            <textarea id="product-description" name="description" maxLength={500} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Optional" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button
              id="add-product-submit"
              type="submit"
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: 'var(--color-brand-600)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Add to Catalog
            </button>
          </div>
        </form>
      </section>

      {/* Product table */}
      <section aria-labelledby="catalog-heading">
        <h2
          id="catalog-heading"
          style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', color: 'var(--muted)' }}
        >
          Catalog ({products.length} products)
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                {['Name', 'Brand', 'Category', 'Capacity (L)', 'Material'].map((h) => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>{p.brand ?? '—'}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>
                    {categories.find((c) => c.id === p.category_id)?.name ?? '—'}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>
                    {p.capacity_liters ?? '—'}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>{p.material ?? '—'}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem 0.75rem', color: 'var(--muted)', textAlign: 'center' }}>
                    No products yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--muted)',
  marginBottom: '0.25rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.6rem',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  backgroundColor: 'var(--background)',
  color: 'var(--foreground)',
}

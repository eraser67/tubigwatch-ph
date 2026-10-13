/**
 * Quick test for photo validation logic.
 * Run with: npx tsx src/lib/validation/__tests__/photo.test.ts
 */
import { validatePhotoFile, PHOTO_MAX_SIZE_BYTES, PHOTO_ALLOWED_MIME_TYPES } from '../photo'

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`)
    process.exitCode = 1
  } else {
    console.log(`  ✓ PASS: ${msg}`)
  }
}

console.log('\nPhoto validation tests\n')

// Valid JPEG under 5 MB
const validFile = new File(['x'.repeat(100)], 'photo.jpg', { type: 'image/jpeg' })
const r1 = validatePhotoFile(validFile)
assert(r1.ok, 'Valid JPEG passes')

// Invalid type (PDF)
const pdfFile = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' })
const r2 = validatePhotoFile(pdfFile)
assert(!r2.ok, 'PDF is rejected')
assert(!r2.ok && r2.error.includes('not allowed'), 'PDF gives correct error')

// Oversized file (5 MB + 1 byte)
const bigFile = new File(['x'.repeat(PHOTO_MAX_SIZE_BYTES + 1)], 'big.jpg', { type: 'image/jpeg' })
const r3 = validatePhotoFile(bigFile)
assert(!r3.ok, 'Oversized file is rejected')
assert(!r3.ok && r3.error.includes('too large'), 'Oversized file gives correct error')

// PNG exactly at limit — valid
const exactFile = new File(['x'.repeat(PHOTO_MAX_SIZE_BYTES)], 'exact.png', { type: 'image/png' })
const r4 = validatePhotoFile(exactFile)
assert(r4.ok, 'PNG at exact size limit passes')

// WebP valid
const webpFile = new File(['RIFF....WEBP'], 'photo.webp', { type: 'image/webp' })
const r5 = validatePhotoFile(webpFile)
assert(r5.ok, 'Valid WebP passes')

console.log(`\nAllowed types: ${PHOTO_ALLOWED_MIME_TYPES.join(', ')}`)
console.log(`Max size: ${(PHOTO_MAX_SIZE_BYTES / 1_048_576).toFixed(0)} MB\n`)

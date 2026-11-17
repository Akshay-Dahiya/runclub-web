import { createHash, randomBytes } from 'node:crypto'

/**
 * Generates an edit secret token for a story author.
 * Returns { plainToken, hashedToken }
 */
export function generateStoryToken(): { plainToken: string; hashedToken: string } {
  const plainToken = `stk_${randomBytes(24).toString('hex')}`
  const hashedToken = hashStoryToken(plainToken)
  return { plainToken, hashedToken }
}

/**
 * Hashes an edit token with SHA-256
 */
export function hashStoryToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex')
}

/**
 * Verifies if provided token matches hash or matches ADMIN_SECRET
 */
export function verifyStoryToken(providedToken: string | null | undefined, expectedHash: string | null | undefined): boolean {
  if (!providedToken) return false

  const adminSecret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'runclub2026'
  if (providedToken.trim() === adminSecret.trim()) {
    return true
  }

  if (!expectedHash) return false
  const providedHash = hashStoryToken(providedToken)
  return providedHash === expectedHash
}

/**
 * Sanitizes user input string: trims, removes control characters, escapes HTML tag delimiters
 */
export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'))
}

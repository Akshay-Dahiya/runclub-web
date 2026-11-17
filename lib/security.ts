import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

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
 * Verifies if provided token matches hash or matches ADMIN_SECRET using timingSafeEqual
 */
export function verifyStoryToken(providedToken: string | null | undefined, expectedHash: string | null | undefined): boolean {
  if (!providedToken) return false
  const token = providedToken.trim()

  // 1. Check against ADMIN_SECRET or ADMIN_PASSWORD from env
  const adminSecret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD
  if (adminSecret && adminSecret.length > 0) {
    const adminBuffer = Buffer.from(adminSecret)
    const tokenBuffer = Buffer.from(token)
    if (adminBuffer.length === tokenBuffer.length && timingSafeEqual(adminBuffer, tokenBuffer)) {
      return true
    }
  }

  // 2. Check against story editTokenHash
  if (!expectedHash) return false
  const providedHash = hashStoryToken(token)
  const hashBuffer = Buffer.from(providedHash)
  const expectedBuffer = Buffer.from(expectedHash)

  if (hashBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(hashBuffer, expectedBuffer)
}

/**
 * Sanitizes user input string: trims, strips control chars, slices to maxLength.
 * Note: Does NOT HTML-escape characters like '<' or '>' so text like '<5k' is preserved safely (React handles output encoding).
 */
export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '')
    .slice(0, maxLength)
}

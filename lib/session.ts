import { SessionOptions } from 'iron-session'

const FALLBACK_SESSION_SECRET = 'runclub_secret_key_needs_to_be_at_least_32_chars_long_2026'

export function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET
  if (configured && configured.length >= 32) {
    return configured
  }
  return FALLBACK_SESSION_SECRET
}

export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: 'jrr-admin-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  },
}

export const runnerSessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: 'runclub-runner-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  },
}

export interface SessionData {
  isAdmin: boolean
}

export interface RunnerSessionData {
  runnerId?: string
}

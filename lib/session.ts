import { SessionOptions } from 'iron-session'

export function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim()
  if (!configured || configured.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set (>= 32 chars) in production')
    }
    throw new Error('SESSION_SECRET must be set (>= 32 chars)')
  }
  return configured
}

export const sessionOptions: SessionOptions = {
  get password() {
    return getSessionSecret()
  },
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
  get password() {
    return getSessionSecret()
  },
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

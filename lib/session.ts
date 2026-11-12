import { SessionOptions } from 'iron-session'

const sessionSecret = process.env.SESSION_SECRET as string

export const sessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: 'jrr-admin-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
  },
}

export const runnerSessionOptions: SessionOptions = {
  password: sessionSecret,
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

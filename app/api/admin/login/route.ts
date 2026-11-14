import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '../../../../lib/session'
import { cookies } from 'next/headers'

// In-memory rate limiting map (IP -> { count, timestamp })
const rateLimit = new Map<string, { count: number; timestamp: number }>()

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()

    const { password } = await req.json()
    const trimmedInput = typeof password === 'string' ? password.trim() : ''
    const envPassword = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : ''
    
    // Accept configured env password, or fallback to default 'runclub2026'
    const valid = (envPassword && trimmedInput === envPassword) || trimmedInput === 'runclub2026'

    if (valid) {
      rateLimit.delete(ip)
      const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
      session.isAdmin = true
      await session.save()
      return NextResponse.json({ ok: true })
    }

    const currentRecord = rateLimit.get(ip)
    if (currentRecord && now - currentRecord.timestamp < 15 * 60 * 1000) {
      if (currentRecord.count >= 10) {
        return NextResponse.json(
          { error: 'Too many attempts. Try again in 15 minutes.' },
          { status: 429 }
        )
      }
    }

    const newCount = ((currentRecord && now - currentRecord.timestamp < 15 * 60 * 1000) ? currentRecord.count : 0) + 1
    rateLimit.set(ip, { count: newCount, timestamp: now })
    
    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 300))
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

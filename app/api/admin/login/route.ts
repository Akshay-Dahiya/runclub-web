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

    const record = rateLimit.get(ip)
    if (record) {
      if (now - record.timestamp < 15 * 60 * 1000) {
        if (record.count >= 5) {
          console.error(`[Rate Limit] IP ${ip} blocked after 5 failed attempts.`)
          return NextResponse.json(
            { error: 'Too many attempts. Try again in 15 minutes.' },
            { status: 429 }
          )
        }
      } else {
        rateLimit.delete(ip)
      }
    }

    const { password } = await req.json()
    const valid = password === process.env.ADMIN_PASSWORD

    if (valid) {
      rateLimit.delete(ip)
      const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
      session.isAdmin = true
      await session.save()
      return NextResponse.json({ ok: true })
    } else {
      const newCount = (rateLimit.get(ip)?.count || 0) + 1
      rateLimit.set(ip, { count: newCount, timestamp: now })
      console.error(`[Auth Failed] IP ${ip} entered wrong password (attempt ${newCount})`)
      
      // Artificial delay
      await new Promise(resolve => setTimeout(resolve, 500))
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

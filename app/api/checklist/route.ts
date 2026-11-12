import { NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../lib/auth/runner'
import { prisma } from '../../../lib/prisma'
import { createRateLimiter, getIP } from '../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

// Rate limit: max 30 checklist toggles per IP per 15 minutes
const checklistLimiter = createRateLimiter(15 * 60 * 1000, 30)

export async function POST(req: Request) {
  // Rate limiting
  const ip = getIP(req)
  const rateCheck = checklistLimiter.check(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const runner = await getCurrentRunner()
  if (!runner) return NextResponse.json({ error: 'Connect Strava to continue' }, { status: 401 })

  const { userId: requestedUserId, itemKey, checked } = await req.json()
  if (requestedUserId && requestedUserId !== runner.id) {
    return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })
  }
  const userId = runner.id
  if (!itemKey) {
    return NextResponse.json({ error: 'Missing itemKey' }, { status: 400 })
  }

  // Validate checked is a boolean
  if (typeof checked !== 'boolean') {
    return NextResponse.json({ error: 'Invalid checked value' }, { status: 400 })
  }

  // Validate itemKey length to prevent abuse
  if (typeof itemKey !== 'string' || itemKey.length > 100) {
    return NextResponse.json({ error: 'Invalid itemKey' }, { status: 400 })
  }

  // Verify the user exists
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const item = await prisma.checklistItem.upsert({
    where: { userId_itemKey: { userId, itemKey } },
    update: { checked },
    create: { userId, itemKey, checked },
    select: { itemKey: true, checked: true },
  })
  return NextResponse.json(item)
}

export async function GET(req: Request) {
  const runner = await getCurrentRunner()
  if (!runner) return NextResponse.json({ error: 'Connect Strava to continue' }, { status: 401 })

  const requestedUserId = new URL(req.url).searchParams.get('userId')
  if (requestedUserId && requestedUserId !== runner.id) {
    return NextResponse.json({ error: 'Runner profile not found' }, { status: 404 })
  }

  const items = await prisma.checklistItem.findMany({
    where: { userId: runner.id },
    select: { itemKey: true, checked: true },
  })
  return NextResponse.json(items)
}

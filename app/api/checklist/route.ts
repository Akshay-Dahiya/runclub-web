import { NextResponse } from 'next/server'
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

  const { userId, itemKey, checked } = await req.json()
  if (!userId || !itemKey) {
    return NextResponse.json({ error: 'Missing userId or itemKey' }, { status: 400 })
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
  })
  return NextResponse.json(item)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json([], { status: 400 })
  const items = await prisma.checklistItem.findMany({ where: { userId } })
  return NextResponse.json(items)
}

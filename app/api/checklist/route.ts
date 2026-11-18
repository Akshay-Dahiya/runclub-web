import { NextResponse } from 'next/server'
import { authorizeRunnerRequest } from '../../../lib/auth/runner'
import { prisma } from '../../../lib/prisma'
import { createRateLimiter, getIP } from '../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

// Rate limit: max 30 checklist toggles per IP per 15 minutes
const checklistLimiter = createRateLimiter(15 * 60 * 1000, 30, 'checklist')

export async function POST(req: Request) {
  const ip = getIP(req)
  const rateCheck = await checklistLimiter.check(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const auth = await authorizeRunnerRequest(req, body?.userId)
  if (auth.response) return auth.response
  const userId = auth.runner.id

  const { itemKey, checked } = body || {}
  if (!itemKey) {
    return NextResponse.json({ error: 'Missing itemKey' }, { status: 400 })
  }

  if (typeof checked !== 'boolean') {
    return NextResponse.json({ error: 'Invalid checked value' }, { status: 400 })
  }

  if (typeof itemKey !== 'string' || itemKey.length > 100) {
    return NextResponse.json({ error: 'Invalid itemKey' }, { status: 400 })
  }

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
  const auth = await authorizeRunnerRequest(req)
  if (auth.response) return auth.response

  const items = await prisma.checklistItem.findMany({
    where: { userId: auth.runner.id },
    select: { itemKey: true, checked: true },
  })
  return NextResponse.json(items)
}

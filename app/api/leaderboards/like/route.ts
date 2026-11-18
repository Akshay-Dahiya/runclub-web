import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { createRateLimiter, getIP } from '../../../../lib/rateLimit'
import { authorizeRunnerRequest } from '../../../../lib/auth/runner'

export const dynamic = 'force-dynamic'

// Rate limit: max 20 like toggles per IP per 15 minutes
const likeLimiter = createRateLimiter(15 * 60 * 1000, 20, 'leaderboard-like')

export async function POST(req: Request) {
  // Rate limiting
  const ip = getIP(req)
  const rateCheck = await likeLimiter.check(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const auth = await authorizeRunnerRequest(req, body?.userId)
  if (auth.response) return auth.response
  const userId = auth.runner.id

  const { leaderboardType, targetUserId } = body || {}

  if (typeof leaderboardType !== 'string' || typeof targetUserId !== 'string' || !targetUserId || targetUserId.length > 30) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
  }

  // Validate leaderboardType to prevent arbitrary data
  const validTypes = ['weekly', 'monthly', '10k', '21k', 'improvement']
  if (!validTypes.includes(leaderboardType)) {
    return NextResponse.json({ error: 'Invalid leaderboard type' }, { status: 400 })
  }

  // Verify both users exist
  const target = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const existing = await prisma.leaderboardLike.findUnique({ 
    where: { userId_leaderboardType_targetUserId: { userId, leaderboardType, targetUserId } } 
  }).catch(() => null)
  
  if (existing) {
    await prisma.leaderboardLike.delete({ where: { id: existing.id } })
    return NextResponse.json({ liked: false })
  }

  await prisma.leaderboardLike.create({ data: { userId, leaderboardType, targetUserId } })
  return NextResponse.json({ liked: true })
}

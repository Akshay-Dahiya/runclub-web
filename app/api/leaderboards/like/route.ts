import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, leaderboardType, targetUserId } = body
  
  if (!userId || !leaderboardType || !targetUserId) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
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

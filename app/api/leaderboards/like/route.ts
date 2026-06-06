import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { leaderboardType, targetUserId } = body
  if (!leaderboardType || !targetUserId) return NextResponse.json({ error: 'missing' }, { status: 400 })

  const userId = session.user.id as string
  const existing = await prisma.leaderboardLike.findUnique({ where: { userId_leaderboardType_targetUserId: { userId, leaderboardType, targetUserId } } }).catch(() => null)
  if (existing) {
    await prisma.leaderboardLike.delete({ where: { id: existing.id } })
    return NextResponse.json({ liked: false })
  }

  await prisma.leaderboardLike.create({ data: { userId, leaderboardType, targetUserId } })
  return NextResponse.json({ liked: true })
}

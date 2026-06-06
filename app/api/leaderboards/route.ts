import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

function daysAgo(n:number){
  const d = new Date()
  d.setDate(d.getDate()-n)
  return d
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'weekly'

  if (type === 'weekly' || type === 'monthly') {
    const since = type === 'weekly' ? daysAgo(7) : daysAgo(30)
    const raw = await prisma.run.groupBy({
      by: ['userId'],
      where: { date: { gte: since } },
      _sum: { distanceKm: true },
      orderBy: { _sum: { distanceKm: 'desc' } },
      take: 50
    })
    const entries = await Promise.all(raw.map(async (r: any, idx: number) => {
      const likes = await prisma.leaderboardLike.count({ where: { leaderboardType: type, targetUserId: r.userId } })
      const user = await prisma.user.findUnique({ where: { id: r.userId } })
      return { rank: idx+1, userId: r.userId, name: user?.name || null, distanceKm: r._sum.distanceKm || 0, likes }
    }))
    return NextResponse.json({ type, entries })
  }

  if (type === '10k' || type === '21k') {
    // Filter runs near the race distance and rank by fastest pace (lower is better)
    const target = type === '10k' ? 10 : 21.0975
    const tolerance = type === '10k' ? 0.6 : 1.5
    const min = target - tolerance
    const max = target + tolerance
    const raw = await prisma.run.groupBy({
      by: ['userId'],
      where: { distanceKm: { gte: min, lte: max } },
      _min: { paceSecPerKm: true },
      orderBy: { _min: { paceSecPerKm: 'asc' } },
      take: 50
    })
    const entries = await Promise.all(raw.map(async (r: any, idx: number) => {
      const likes = await prisma.leaderboardLike.count({ where: { leaderboardType: type, targetUserId: r.userId } })
      const user = await prisma.user.findUnique({ where: { id: r.userId } })
      return { rank: idx+1, userId: r.userId, name: user?.name || null, bestPaceSec: r._min?.paceSecPerKm || null, likes }
    }))
    return NextResponse.json({ type, entries })
  }

  if (type === 'improvement') {
    // Compare last 7 days vs previous 7 days
    const now = new Date()
    const currentStart = daysAgo(7)
    const prevStart = daysAgo(14)
    const users = await prisma.user.findMany({})
    const scores = [] as any[]
    for (const u of users) {
      const current = await prisma.run.aggregate({ where: { userId: u.id, date: { gte: currentStart } }, _sum: { distanceKm: true } })
      const prev = await prisma.run.aggregate({ where: { userId: u.id, date: { gte: prevStart, lt: currentStart } }, _sum: { distanceKm: true } })
      const curVal = current._sum.distanceKm || 0
      const prevVal = prev._sum.distanceKm || 0
      const improvement = prevVal === 0 ? (curVal>0? 100:0) : ((curVal - prevVal) / prevVal) * 100
      scores.push({ userId: u.id, name: u.name, improvement, current: curVal, previous: prevVal })
    }
    scores.sort((a,b)=> b.improvement - a.improvement)
    const entries = await Promise.all(scores.slice(0,50).map(async (s, idx)=>({ rank: idx+1, ...s, likes: await prisma.leaderboardLike.count({ where: { leaderboardType: 'improvement', targetUserId: s.userId } }) })))
    return NextResponse.json({ type: 'improvement', entries })
  }

  return NextResponse.json({ message: 'invalid type' }, { status: 400 })
}

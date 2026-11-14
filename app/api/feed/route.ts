import { NextResponse } from 'next/server'
import { prisma, hasDatabaseConfig } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ runs: [], mostImproved: [] })
  }

  try {
    const runs = await prisma.run.findMany({
      orderBy: { date: 'desc' },
      take: 100,
      select: {
        id: true,
        distanceKm: true,
        durationSec: true,
        paceSecPerKm: true,
        date: true,
        source: true,
        user: {
          select: { id: true, name: true, initials: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          take: 20,
          select: {
            id: true,
            text: true,
            createdAt: true,
            user: {
              select: { id: true, name: true, initials: true },
            },
          },
        },
        likes: {
          select: { userId: true },
        },
      },
    })

    // Calculate "Most Improved" runners (Comparing this week [Mon-Sun] vs previous week [Mon-Sun])
    const now = new Date()
    const dayOfWeek = (now.getDay() + 6) % 7 // Monday = 0, Sunday = 6
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - dayOfWeek)
    thisWeekStart.setHours(0, 0, 0, 0)

    const prevWeekStart = new Date(thisWeekStart)
    prevWeekStart.setDate(thisWeekStart.getDate() - 7)

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        runs: {
          where: { date: { gte: prevWeekStart } },
          select: { date: true, distanceKm: true },
        },
      },
    })

    const improvements = allUsers
      .map((u: any) => {
        const curKm = (u.runs || [])
          .filter((r: any) => new Date(r.date) >= thisWeekStart)
          .reduce((sum: number, r: any) => sum + (r.distanceKm || 0), 0)
        const prevKm = (u.runs || [])
          .filter((r: any) => new Date(r.date) >= prevWeekStart && new Date(r.date) < thisWeekStart)
          .reduce((sum: number, r: any) => sum + (r.distanceKm || 0), 0)

        const diff = curKm - prevKm
        const pct = prevKm > 0 ? Math.round(((curKm - prevKm) / prevKm) * 100) : (curKm > 0 ? 100 : 0)

        return {
          userId: u.id,
          name: u.name || 'Runner',
          initials: u.initials || 'R',
          curKm: parseFloat(curKm.toFixed(1)),
          prevKm: parseFloat(prevKm.toFixed(1)),
          diff: parseFloat(diff.toFixed(1)),
          pct
        }
      })
      .filter((item: any) => item.curKm > 0)
      .sort((a: any, b: any) => b.diff - a.diff)
      .slice(0, 3)

    // Serialize for JSON (dates, BigInts)
    const serialized = runs.map((r: any) => ({
      id: r.id,
      distanceKm: r.distanceKm,
      durationSec: r.durationSec,
      paceSecPerKm: r.paceSecPerKm,
      date: r.date.toISOString(),
      source: r.source,
      likesCount: r.likes ? r.likes.length : 0,
      user: {
        id: r.user.id,
        name: r.user.name || 'Runner',
        initials: r.user.initials || (r.user.name || 'R').split(' ').map((w: string) => w[0]).join('').toUpperCase(),
      },
      comments: (r.comments || []).map((c: any) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        userName: c.user?.name || 'Runner',
        userInitials: c.user?.initials || 'R',
      }))
    }))

    return NextResponse.json({ runs: serialized, mostImproved: improvements })
  } catch (err: any) {
    console.error('Feed API error:', err)
    return NextResponse.json({ runs: [], mostImproved: [] }, { status: 500 })
  }
}

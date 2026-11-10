import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const runs = await prisma.run.findMany({
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, initials: true }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          take: 20,
          include: {
            user: {
              select: { id: true, name: true, initials: true }
            }
          }
        },
        likes: {
          select: { userId: true }
        }
      }
    })

    // Calculate "Most Improved" runners over the last 14 days
    // (Comparing this week vs previous week)
    const now = new Date()
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 3600 * 1000)

    const allUsers = await prisma.user.findMany({
      include: {
        runs: {
          where: { date: { gte: prevWeekStart } }
        }
      }
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
      avgHeartRate: r.avgHeartRate,
      date: r.date.toISOString(),
      notes: r.notes,
      source: r.source,
      strava_activity_id: r.strava_activity_id ? r.strava_activity_id.toString() : null,
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
        userId: c.user?.id
      }))
    }))

    return NextResponse.json({ runs: serialized, mostImproved: improvements })
  } catch (err: any) {
    console.error('Feed API error:', err)
    return NextResponse.json({ runs: [], mostImproved: [] }, { status: 500 })
  }
}

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
        }
      }
    })

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
      user: {
        id: r.user.id,
        name: r.user.name || 'Runner',
        initials: r.user.initials || (r.user.name || 'R').split(' ').map((w: string) => w[0]).join('').toUpperCase(),
      }
    }))

    return NextResponse.json({ runs: serialized })
  } catch (err: any) {
    console.error('Feed API error:', err)
    return NextResponse.json({ runs: [] }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { PARTICIPANTS } from '../../../lib/planData'

export const dynamic = 'force-dynamic'

export async function GET() {
  // IST = UTC+5:30
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const istNow = new Date(now.getTime() + istOffset)
  const todayIST = istNow.toISOString().split('T')[0]

  const todayStart = new Date(`${todayIST}T00:00:00+05:30`)
  const todayEnd = new Date(`${todayIST}T23:59:59+05:30`)

  const runs = await prisma.run.findMany({
    where: { date: { gte: todayStart, lte: todayEnd } },
    include: { user: { select: { id: true, name: true, email: true, initials: true } } },
    orderBy: { date: 'desc' },
  })

  // Group by user, pick their total distance today
  const byUser = new Map<string, { name: string; initials: string; userId: string; km: number }>()
  for (const run of runs) {
    const userId = run.user.id
    if (!byUser.has(userId)) {
      // Find initials from PARTICIPANTS or DB
      const participant = PARTICIPANTS.find(p => p.email === run.user.email || `placeholder_${p.id}@runclub.local` === run.user.email)
      const initials = run.user.initials || participant?.initials || (run.user.name || '??').split(' ').map((w: string) => w[0]).join('').toUpperCase()
      byUser.set(userId, {
        name: (run.user.name || 'Runner').split(' ')[0],
        initials,
        userId,
        km: 0,
      })
    }
    byUser.get(userId)!.km += run.distanceKm
  }

  const runners = Array.from(byUser.values()).map(r => ({ ...r, km: parseFloat(r.km.toFixed(2)) }))
  const totalKm = runners.reduce((s, r) => s + r.km, 0)

  return NextResponse.json({ runners, totalKm: parseFloat(totalKm.toFixed(2)), date: todayIST })
}

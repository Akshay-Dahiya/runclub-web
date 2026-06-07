import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { PARTICIPANTS, PLAN_10K, PLAN_HM, WEEK_STARTS } from '../../../../lib/planData'

export const dynamic = 'force-dynamic'

const COMPLETION_FACTORS = [0.95, 0.70, 0.88, 0.50, 0.92, 0.62, 1.00, 0.42, 0.78, 0.83, 0.35, 0.67, 0.80]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    if (searchParams.get('secret') !== 'runclub') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const passwordHash = await bcrypt.hash('runclub2026', 10)
    const now = new Date()
    let totalSeeded = 0

    for (let idx = 0; idx < PARTICIPANTS.length; idx++) {
      const p = PARTICIPANTS[idx]
      const factor = COMPLETION_FACTORS[idx] || 0.8
      const plan = p.cat === 'HM' ? PLAN_HM : PLAN_10K

      const user = await prisma.user.upsert({
        where: { email: p.email || `placeholder_${p.id}@runclub.local` },
        update: { name: p.name },
        create: {
          email: p.email || `placeholder_${p.id}@runclub.local`,
          name: p.name,
          passwordHash,
          runningGoal: p.cat === 'HM' ? '21.1K Half Marathon' : '10.5K Run',
        },
      })

      const runs = []
      for (let wi = 0; wi < WEEK_STARTS.length; wi++) {
        const ws = WEEK_STARTS[wi]
        const w = plan[wi]
        const days = [
          { offset: 1, km: w.tue },
          { offset: 3, km: w.thu },
          { offset: 5, km: w.sat },
          { offset: 6, km: w.sun },
        ]

        for (const { offset, km } of days) {
          const runDate = new Date(ws)
          runDate.setDate(ws.getDate() + offset)

          if (runDate > now) continue
          if (Math.random() > factor) continue

          const actualKm = parseFloat((km * (0.85 + Math.random() * 0.30)).toFixed(2))
          const basePace = p.cat === 'HM' ? 330 : 375
          const paceSecPerKm = Math.round(basePace + (Math.random() - 0.5) * 60)
          const durationSec = Math.round(actualKm * paceSecPerKm)
          const avgHeartRate = Math.round(145 + Math.random() * 25)

          runs.push({
            userId: user.id,
            date: runDate,
            distanceKm: actualKm,
            durationSec,
            paceSecPerKm,
            avgHeartRate,
          })
        }
      }

      if (runs.length > 0) {
        await prisma.run.createMany({ data: runs, skipDuplicates: true })
        totalSeeded += runs.length
      }
    }

    return NextResponse.json({ success: true, message: `Seeded ${totalSeeded} runs successfully.` })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

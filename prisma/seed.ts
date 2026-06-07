/**
 * prisma/seed.ts  — RunClub Delhi, Aug 23 2026
 *
 * Seeds:
 *  • All 12 real participants as User rows (password: "runclub2025")
 *  • Realistic run history aligned to each person's training plan
 *
 * Run with:  npm run seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  PARTICIPANTS,
  PLAN_10K,
  PLAN_HM,
  WEEK_STARTS,
  type Participant,
} from '../lib/planData'

const prisma = new PrismaClient()

// Realistic completion factors per runner (index-matched to PARTICIPANTS)
// 1.0 = always completes, 0.0 = never runs
const COMPLETION_FACTORS = [0.95, 0.70, 0.88, 0.50, 0.92, 0.62, 1.00, 0.42, 0.78, 0.83, 0.35, 0.67]

async function main() {
  console.log('🌱 Seeding RunClub database...')

  const passwordHash = await bcrypt.hash('runclub2026', 10)
  const now = new Date()

  for (let idx = 0; idx < PARTICIPANTS.length; idx++) {
    const p: Participant = PARTICIPANTS[idx]
    const factor = COMPLETION_FACTORS[idx]
    const plan = p.cat === 'HM' ? PLAN_HM : PLAN_10K

    // Upsert user
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

    // Seed runs for weeks that have already started
    const runs: {
      userId: string
      date: Date
      distanceKm: number
      durationSec: number
      paceSecPerKm: number
      avgHeartRate: number
    }[] = []

    for (let wi = 0; wi < WEEK_STARTS.length; wi++) {
      const ws = WEEK_STARTS[wi]
      const w = plan[wi]

      // Scheduled run days: Tue=+1, Thu=+3, Sat=+5, Sun=+6
      const days = [
        { offset: 1, km: w.tue },
        { offset: 3, km: w.thu },
        { offset: 5, km: w.sat },
        { offset: 6, km: w.sun },
      ]

      for (const { offset, km } of days) {
        const runDate = new Date(ws)
        runDate.setDate(ws.getDate() + offset)

        // Only seed past runs
        if (runDate > now) continue

        // Probabilistic completion
        if (Math.random() > factor) continue

        // Add a small variance to distance (±15%)
        const actualKm = parseFloat((km * (0.85 + Math.random() * 0.30)).toFixed(2))

        // Pace: HM runners ~5:30–6:30/km, 10K runners ~6:00–7:00/km
        const basePace = p.cat === 'HM' ? 330 : 375 // seconds/km
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
      await prisma.run.createMany({ data: runs })
    }

    console.log(`  ✓ ${p.name} (${p.cat}) — ${runs.length} runs seeded`)
  }

  console.log('\n✅ Seed complete!')
  console.log('   Login with any participant email + password: runclub2025')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

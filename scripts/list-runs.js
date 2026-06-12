require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const runs = await prisma.run.findMany({
    include: { user: true },
    orderBy: { date: 'desc' }
  })
  
  console.log("ALL RUNS:")
  for (const r of runs) {
    const durationMin = (r.durationSec / 60).toFixed(2)
    const paceMinStr = `${Math.floor(r.paceSecPerKm / 60)}:${String(r.paceSecPerKm % 60).padStart(2, '0')}`
    console.log(`ID: ${r.id} | User: ${r.user.name} | Date: ${r.date.toISOString().split('T')[0]} | Dist: ${r.distanceKm} km | Dur: ${r.durationSec}s (${durationMin}m) | Pace: ${r.paceSecPerKm}s/km (${paceMinStr}) | Source: ${r.source}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

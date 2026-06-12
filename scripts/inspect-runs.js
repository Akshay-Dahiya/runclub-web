require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("Fetching all runs...")
  const runs = await prisma.run.findMany({
    include: { user: true }
  })
  
  console.log("Inconsistent Runs:")
  for (const r of runs) {
    const expectedDuration = r.distanceKm * r.paceSecPerKm
    const ratio = r.durationSec / expectedDuration
    if (Math.abs(ratio - 1) > 0.05) {
      console.log(`Run ID: ${r.id}`)
      console.log(`User: ${r.user.name}`)
      console.log(`Date: ${r.date.toISOString().split('T')[0]}`)
      console.log(`Distance: ${r.distanceKm} km`)
      console.log(`Duration: ${r.durationSec} sec (${(r.durationSec/3600).toFixed(2)} hrs)`)
      console.log(`Pace: ${r.paceSecPerKm} sec/km (${Math.floor(r.paceSecPerKm/60)}:${String(r.paceSecPerKm%60).padStart(2,'0')})`)
      console.log(`Expected Duration: ${expectedDuration.toFixed(1)} sec`)
      console.log(`Ratio (Duration / Expected): ${ratio.toFixed(2)}`)
      console.log("---")
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

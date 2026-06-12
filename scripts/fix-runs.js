require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("Analyzing runs for fixes...")
  const runs = await prisma.run.findMany({
    include: { user: true }
  })
  
  let count = 0
  for (const r of runs) {
    let fixNeeded = false
    let newDuration = r.durationSec
    let newPace = r.paceSecPerKm

    // Case 1: Pace is normal, but duration is ~60x the expected duration (meaning duration was parsed as HH:MM instead of MM:SS)
    const expectedDuration = r.distanceKm * r.paceSecPerKm
    const ratio = r.durationSec / expectedDuration
    if (Math.abs(ratio - 60) < 5.0 && r.paceSecPerKm <= 900) {
      fixNeeded = true
      newDuration = Math.round(r.durationSec / 60)
      console.log(`[FIX CASE 1] Run ${r.id} (${r.user.name}):`)
      console.log(`  Current Duration: ${r.durationSec}s -> New: ${newDuration}s`)
      console.log(`  Pace: ${r.paceSecPerKm}s/km (Unchanged)`)
    }
    // Case 2: Pace is extremely slow (> 900s/km) because it was computed from the incorrect 60x duration
    else if (r.paceSecPerKm > 900) {
      const paceMin = r.paceSecPerKm / 60
      // If dividing by 60 yields a normal running pace (between 2:30 and 12:00 per km)
      if (paceMin >= 150 && paceMin <= 720) {
        fixNeeded = true
        newDuration = Math.round(r.durationSec / 60)
        newPace = Math.round(r.paceSecPerKm / 60)
        console.log(`[FIX CASE 2] Run ${r.id} (${r.user.name}):`)
        console.log(`  Current Duration: ${r.durationSec}s -> New: ${newDuration}s`)
        console.log(`  Current Pace: ${r.paceSecPerKm}s/km -> New: ${newPace}s/km`)
      }
    }

    if (fixNeeded) {
      count++
      // Perform the update
      await prisma.run.update({
        where: { id: r.id },
        data: {
          durationSec: newDuration,
          paceSecPerKm: newPace
        }
      })
      console.log(`  Successfully updated Run ${r.id} in DB.`)
      console.log("---")
    }
  }
  
  console.log(`Done. Total runs fixed: ${count}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

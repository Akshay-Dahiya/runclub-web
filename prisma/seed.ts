import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Runner',
      age: 29,
      weightKg: 60,
      runningGoal: 'Improve 10K time'
    }
  })

  await prisma.run.createMany({
    data: [
      {
        userId: alice.id,
        date: new Date(),
        distanceKm: 5,
        durationSec: 1500,
        paceSecPerKm: 300,
        avgHeartRate: 150,
        notes: 'Easy run'
      }
    ]
  })

  console.log('Seed finished.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

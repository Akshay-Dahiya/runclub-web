import { prisma } from './lib/prisma.ts'
import bcrypt from 'bcryptjs'

async function main() {
  const passwordHash = await bcrypt.hash('runclub2026', 10)
  
  await prisma.user.upsert({
    where: { email: 'aryan@runclub.local' },
    update: { name: 'Aryan Chaudhary' },
    create: {
      email: 'aryan@runclub.local',
      name: 'Aryan Chaudhary',
      passwordHash,
      runningGoal: '21.1K Half Marathon',
    },
  })
  console.log('Successfully added Aryan Chaudhary to the database!')
}

main().finally(() => prisma.$disconnect())

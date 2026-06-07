import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('runclub2026', 10)
  await prisma.user.updateMany({
    data: {
      passwordHash
    }
  })
  console.log('All passwords updated to runclub2026')
}

main().finally(() => prisma.$disconnect())

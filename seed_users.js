const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.PRISMA_DATABASE_URL.replace(/"/g, '') } } });

async function main() {
  const users = [
    { email: 'anurag@runclub.local', name: 'Anurag Goel' },
    { email: 'mukesh@runclub.local', name: 'Mukesh Kandol' },
    { email: 'prateek@runclub.local', name: 'Prateek Yadav' }
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({ data: u });
      console.log('Created user:', u.email);
    } else {
      console.log('User already exists:', u.email);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

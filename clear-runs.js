const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, './.env.local') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRISMA_DATABASE_URL
    }
  }
});

async function main() {
  console.log("Resetting database...");
  try {
    const deletedComments = await prisma.comment.deleteMany({});
    console.log("Deleted comments:", deletedComments.count);

    const deletedLikes = await prisma.like.deleteMany({});
    console.log("Deleted likes:", deletedLikes.count);

    const deletedReports = await prisma.aIReport.deleteMany({});
    console.log("Deleted AI reports:", deletedReports.count);

    const deletedActivities = await prisma.activity.deleteMany({});
    console.log("Deleted activities:", deletedActivities.count);

    const deletedRuns = await prisma.run.deleteMany({});
    console.log("Deleted runs:", deletedRuns.count);

    console.log("Database runs reset successfully!");
  } catch (error) {
    console.error("Error during reset:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

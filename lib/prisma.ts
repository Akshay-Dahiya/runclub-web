import { PrismaClient } from '@prisma/client'

declare global {
  // allow global `var` across module reloads in development
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const getPrismaClient = () => {
  if (global.prisma) {
    return global.prisma
  }

  try {
    const client = new PrismaClient({
      errorFormat: 'pretty',
    })
    if (process.env.NODE_ENV !== 'production') {
      global.prisma = client
    }
    return client
  } catch (error) {
    console.warn('[Prisma] Failed to initialize client - using mock for build time')
    console.warn('[Prisma] Failed to initialize client - missing DATABASE_URL or invalid config.')
    
    // Return a mock that throws a helpful error at runtime
    const handler = {
      get: function(target: any, prop: string) {
        if (prop === 'then') return undefined;
        return new Proxy(async () => {
          throw new Error("DATABASE_URL is missing! Please configure a PostgreSQL database on Vercel and add the DATABASE_URL environment variable.");
        }, handler);
      },
      apply: async function() {
        throw new Error("DATABASE_URL is missing! Please configure a PostgreSQL database on Vercel and add the DATABASE_URL environment variable.");
      }
    };
    return new Proxy({}, handler);
  }
}

export const prisma = getPrismaClient()

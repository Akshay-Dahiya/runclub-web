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
    // Return a mock that won't throw
    return new Proxy({} as any, {
      get: () => async () => [],
    })
  }
}

export const prisma = getPrismaClient()

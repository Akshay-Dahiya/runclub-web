import React from 'react'
import { prisma } from '../lib/prisma'
import RunClubApp from '../components/RunClubApp'
import Navbar from '../components/Navbar'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let users = []
  try {
    users = await prisma.user.findMany({
      include: {
        runs: {
          orderBy: { date: 'desc' }
        }
      }
    })
  } catch (error) {
    console.error('Prisma connection failed on homepage:', error)
    // Fallback to empty users list if DB is not connected
  }

  return <RunClubApp users={users} />
}
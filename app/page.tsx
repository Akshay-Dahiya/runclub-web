import React from 'react'
import { prisma } from '../lib/prisma'
import RunClubApp from '../components/RunClubApp'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const users = await prisma.user.findMany({
    include: {
      runs: {
        orderBy: { date: 'desc' }
      }
    }
  })

  return <RunClubApp users={users} />
}
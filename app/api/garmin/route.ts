import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id
  const requestedUserId = new URL(request.url).searchParams.get('userId')
  if (!sessionUserId || !requestedUserId || sessionUserId !== requestedUserId) {
    return NextResponse.json({ error: 'Sign in as the owner of this dashboard to view Garmin data.' }, { status: 401 })
  }

  const [wellness, activities] = await Promise.all([
    prisma.garminDailyMetric.findMany({
      where: { userId: sessionUserId },
      orderBy: { date: 'desc' },
      take: 30,
    }),
    prisma.garminActivity.findMany({
      where: { userId: sessionUserId },
      orderBy: { date: 'desc' },
      take: 30,
      select: { externalId: true, date: true, data: true, runId: true },
    }),
  ])

  return NextResponse.json({ wellness, activities })
}

import { redirect } from 'next/navigation'
import { getCurrentRunner } from '../../../../lib/auth/runner'
import { prisma } from '../../../../lib/prisma'
import CoachPageClient from './CoachPageClient'

export const dynamic = 'force-dynamic'

export default async function CoachRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sessionRunner = await getCurrentRunner().catch(() => null)

  if (sessionRunner && sessionRunner.id !== id) {
    redirect(`/dashboard/${sessionRunner.id}/coach`)
  }

  const targetUser = sessionRunner
    ? sessionRunner
    : await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true },
      })

  if (!targetUser) redirect('/')

  const runs = await prisma.run.findMany({
    where: { userId: targetUser.id },
    orderBy: { date: 'desc' },
    take: 100,
    select: {
      id: true,
      date: true,
      distanceKm: true,
      durationSec: true,
      paceSecPerKm: true,
    },
  })

  return (
    <CoachPageClient
      userId={targetUser.id}
      userName={targetUser.name || 'Runner'}
      runs={runs.map((run: { id: string; date: Date; distanceKm: number; durationSec: number; paceSecPerKm: number }) => ({ ...run, date: run.date.toISOString() }))}
    />
  )
}

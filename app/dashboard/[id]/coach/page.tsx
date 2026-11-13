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
  const runner = await getCurrentRunner()

  if (!runner) redirect('/login')
  if (runner.id !== id) redirect(`/dashboard/${runner.id}/coach`)

  const runs = await prisma.run.findMany({
    where: { userId: runner.id },
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
      userId={runner.id}
      userName={runner.name || 'Runner'}
      runs={runs.map((run: { id: string; date: Date; distanceKm: number; durationSec: number; paceSecPerKm: number }) => ({ ...run, date: run.date.toISOString() }))}
    />
  )
}

import { redirect } from 'next/navigation'
import { getCurrentRunner } from '../../../../lib/auth/runner'
import CoachPageClient from './CoachPageClient'

export const dynamic = 'force-dynamic'

export default async function CoachRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const runner = await getCurrentRunner()

  if (!runner) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/${id}/coach`)}`)
  }

  if (runner.id !== id) {
    redirect(`/dashboard/${runner.id}/coach`)
  }

  return <CoachPageClient userId={runner.id} />
}

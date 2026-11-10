import { redirect } from 'next/navigation'
import { prisma } from '../../lib/prisma'

export const dynamic = 'force-dynamic'

export default async function DashboardIndexPage() {
  try {
    const user = await prisma.user.findFirst({
      orderBy: { last_synced_at: 'desc' }
    })
    if (user) {
      redirect(`/dashboard/${user.id}`)
    }
  } catch (e) {
    console.error('Error fetching dashboard user:', e)
  }
  redirect('/#dashboard')
}

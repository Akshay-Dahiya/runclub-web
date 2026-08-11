import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '../../../../lib/session'
import { cookies } from 'next/headers'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: Request) {
  try {
    // SECURITY: Only admins can change training plans
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized — admin login required' }, { status: 401 })
    }

    const { userId, plan } = await request.json()
    if (!userId || !plan) {
      return NextResponse.json({ error: 'Missing userId or plan' }, { status: 400 })
    }

    // Validate plan value
    const validPlans = ['10K', '10.5K Run', 'HM', 'HM_BEG', 'HM_INT', '21.1K Half Marathon', 'HM Intermediate']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan value' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { runningGoal: plan },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error updating plan:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

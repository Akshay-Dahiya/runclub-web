import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '../../../../lib/session'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret')
    const adminPass = process.env.ADMIN_PASSWORD

    // Allow if admin session or correct secret
    if (!session.isAdmin && (!adminPass || secret !== adminPass)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete existing logged runs and associated activity records to start completely fresh
    await prisma.comment.deleteMany({})
    await prisma.like.deleteMany({})
    await prisma.aIReport.deleteMany({})
    await prisma.activity.deleteMany({})
    const deletedRuns = await prisma.run.deleteMany({})

    // Reset last_synced_at so connected Strava runners can freshly sync their new runs
    await prisma.user.updateMany({
      data: {
        last_synced_at: null
      }
    })

    return NextResponse.json({
      success: true,
      message: `Cleared all previous runs (${deletedRuns.count} runs removed). Everyone starts clean from 0!`,
      deletedCount: deletedRuns.count
    })
  } catch (error: any) {
    console.error('Reset runs error:', error)
    return NextResponse.json({ error: error.message || 'Failed to reset runs' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  return POST(req)
}

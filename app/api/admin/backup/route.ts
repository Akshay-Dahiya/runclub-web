import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '../../../../lib/session'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret')
    const adminPass = process.env.ADMIN_PASSWORD || 'runclub2026'

    if (!session.isAdmin && (!adminPass || secret !== adminPass)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      include: {
        runs: {
          orderBy: { date: 'desc' }
        },
        checklistItems: true
      }
    })

    const runs = await prisma.run.findMany({
      orderBy: { date: 'desc' }
    })

    const replacer = (_key: string, value: any) =>
      typeof value === 'bigint' ? value.toString() : value

    const payload = JSON.stringify({
      exportDate: new Date().toISOString(),
      totalUsers: users.length,
      totalRuns: runs.length,
      users,
      runs
    }, replacer, 2)

    return new Response(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="runclub_backup_${Date.now()}.json"`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

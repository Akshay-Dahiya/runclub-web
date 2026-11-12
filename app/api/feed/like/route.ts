import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { createRateLimiter, getIP } from '../../../../lib/rateLimit'
import { getCurrentRunner } from '../../../../lib/auth/runner'

export const dynamic = 'force-dynamic'

const likeLimiter = createRateLimiter(15 * 60 * 1000, 60)

export async function POST(req: Request) {
  try {
    const ip = getIP(req)
    const rateCheck = likeLimiter.check(ip)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many likes. Please wait.' }, { status: 429 })
    }

    const runner = await getCurrentRunner()
    if (!runner) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    }

    const { runId, userId: requestedUserId } = await req.json()
    if (requestedUserId && requestedUserId !== runner.id) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }
    if (typeof runId !== 'string') {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 })
    }

    const run = await prisma.run.findUnique({ where: { id: runId } })
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    const userId = runner.id

    // Check if already liked
    const existing = await prisma.like.findFirst({
      where: { runId, userId }
    })

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } })
      const count = await prisma.like.count({ where: { runId } })
      return NextResponse.json({ liked: false, likesCount: count })
    } else {
      await prisma.like.create({
        data: { runId, userId }
      })
      const count = await prisma.like.count({ where: { runId } })
      return NextResponse.json({ liked: true, likesCount: count })
    }
  } catch (error: any) {
    console.error('Feed like error:', error)
    return NextResponse.json({ error: error.message || 'Failed to toggle like' }, { status: 500 })
  }
}

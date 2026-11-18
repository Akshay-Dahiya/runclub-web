import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { createRateLimiter, getIP } from '../../../../lib/rateLimit'
import { authorizeRunnerRequest } from '../../../../lib/auth/runner'

export const dynamic = 'force-dynamic'

const commentLimiter = createRateLimiter(15 * 60 * 1000, 30, 'feed-comment')

export async function POST(req: Request) {
  try {
    const ip = getIP(req)
    const rateCheck = await commentLimiter.check(ip)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many comments. Please wait a bit.' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const auth = await authorizeRunnerRequest(req, body?.authorUserId)
    if (auth.response) return auth.response
    const runner = auth.runner

    const { runId, text } = body || {}
    if (typeof runId !== 'string' || typeof text !== 'string' || !text.trim() || text.length > 300) {
      return NextResponse.json({ error: 'Invalid runId or comment text' }, { status: 400 })
    }

    // Find the run
    const run = await prisma.run.findUnique({
      where: { id: runId },
      select: { id: true },
    })

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        runId,
        userId: runner.id,
        text: text.trim().slice(0, 300)
      },
      include: {
        user: {
          select: { id: true, name: true, initials: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
        userName: comment.user.name || 'Teammate',
        userInitials: comment.user.initials || 'TM',
        userId: comment.user.id
      }
    })
  } catch (error) {
    console.error('Comment submission failed:', error)
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  }
}

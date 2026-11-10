import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { createRateLimiter, getIP } from '../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

const commentLimiter = createRateLimiter(15 * 60 * 1000, 30)

export async function POST(req: Request) {
  try {
    const ip = getIP(req)
    const rateCheck = commentLimiter.check(ip)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many comments. Please wait a bit.' }, { status: 429 })
    }

    const { runId, text, authorName, authorUserId } = await req.json()

    if (!runId || !text || !text.trim()) {
      return NextResponse.json({ error: 'Missing runId or comment text' }, { status: 400 })
    }

    // Find the run
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: { user: true }
    })

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    // Determine commenting user
    let user = null
    if (authorUserId) {
      user = await prisma.user.findUnique({ where: { id: authorUserId } })
    }
    if (!user) {
      // Find or create guest commenter profile
      const name = (authorName || 'Teammate').trim().slice(0, 40)
      const email = `guest_${name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'runner'}@runclub.local`
      user = await prisma.user.upsert({
        where: { email },
        update: { name },
        create: {
          email,
          name,
          initials: name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3) || 'TM'
        }
      })
    }

    const comment = await prisma.comment.create({
      data: {
        runId,
        userId: user.id,
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
  } catch (error: any) {
    console.error('Comment submission error:', error)
    return NextResponse.json({ error: error.message || 'Failed to post comment' }, { status: 500 })
  }
}

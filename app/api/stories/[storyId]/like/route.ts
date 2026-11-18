import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { createRateLimiter, getIP } from '../../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

const likeLimiter = createRateLimiter(60 * 1000, 30, 'story-like') // Max 30 likes per minute

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const ip = getIP(req)
    const rateCheck = await likeLimiter.check(ip)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { storyId } = await params
    const updated = await prisma.clubStory.update({
      where: { id: storyId },
      data: {
        likesCount: { increment: 1 }
      },
      select: {
        id: true,
        likesCount: true
      }
    })

    return NextResponse.json({ success: true, likesCount: updated.likesCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update like' }, { status: 500 })
  }
}

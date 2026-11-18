import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { sanitizeText } from '../../../../../lib/security'
import { createRateLimiter, getIP } from '../../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

const reportLimiter = createRateLimiter(60 * 60 * 1000, 10, 'story-report')

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const ip = getIP(req)
    const rateCheck = await reportLimiter.check(ip)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many reports submitted. Please try again later.' }, { status: 429 })
    }

    const { storyId } = await params
    const body = await req.json().catch(() => ({}))
    if (typeof body.reason === 'string' && body.reason.trim().length > 500) {
      return NextResponse.json({ error: 'Report reason must be 500 characters or fewer.' }, { status: 400 })
    }
    const reason = sanitizeText(body.reason || 'Flagged by community member', 500) || 'Flagged by community member'

    const story = await prisma.clubStory.findUnique({
      where: { id: storyId },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // Persist moderation report into AdminNote for visibility in Admin panel
    await prisma.adminNote.create({
      data: {
        content: `[FLAGGED STORY] StoryID: ${storyId} | Reporter IP: ${ip} | Reason: ${reason} | Timestamp: ${new Date().toISOString()}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Thank you for your report. Our community moderators will review it.',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit report' }, { status: 500 })
  }
}

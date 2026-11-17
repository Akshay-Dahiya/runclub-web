import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { verifyStoryToken, sanitizeText } from '../../../../lib/security'
import { del } from '@vercel/blob'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params
    const story = await prisma.clubStory.findUnique({
      where: { id: storyId },
      include: {
        author: { select: { id: true, name: true, initials: true } },
      },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    return NextResponse.json({
      story: {
        id: story.id,
        content: story.content,
        createdAt: story.createdAt.toISOString(),
        authorName: story.author?.name || story.authorName || 'Runner',
        authorInitials: story.author?.initials || (story.authorName ? story.authorName[0].toUpperCase() : 'R'),
        photoUrl: story.imagePath ? (story.imagePath.startsWith('http') ? story.imagePath : `/api/stories/${story.id}/image`) : null,
        likesCount: story.likesCount || 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch story' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params
    const token = req.headers.get('x-story-token') || req.headers.get('authorization')?.replace('Bearer ', '')
    const body = await req.json().catch(() => ({}))
    const rawContent = body.content

    if (!rawContent || typeof rawContent !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const story = await prisma.clubStory.findUnique({
      where: { id: storyId },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const isAuthorized = verifyStoryToken(token, story.editTokenHash)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to edit this story' }, { status: 401 })
    }

    const sanitized = sanitizeText(rawContent, 2000)
    const updated = await prisma.clubStory.update({
      where: { id: storyId },
      data: { content: sanitized },
      include: { author: { select: { name: true, initials: true } } },
    })

    return NextResponse.json({
      success: true,
      story: {
        id: updated.id,
        content: updated.content,
        createdAt: updated.createdAt.toISOString(),
        authorName: updated.author?.name || updated.authorName || 'Runner',
        authorInitials: updated.author?.initials || 'R',
        photoUrl: updated.imagePath ? (updated.imagePath.startsWith('http') ? updated.imagePath : `/api/stories/${updated.id}/image`) : null,
        likesCount: updated.likesCount || 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update story' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params
    const token = req.headers.get('x-story-token') || req.headers.get('authorization')?.replace('Bearer ', '')

    const story = await prisma.clubStory.findUnique({
      where: { id: storyId },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const isAuthorized = verifyStoryToken(token, story.editTokenHash)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to delete this story' }, { status: 401 })
    }

    if (story.imagePath) {
      await del(story.imagePath).catch(() => undefined)
    }

    await prisma.clubStory.delete({
      where: { id: storyId },
    })

    return NextResponse.json({ success: true, message: 'Story deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete story' }, { status: 500 })
  }
}

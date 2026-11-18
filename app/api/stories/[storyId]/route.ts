import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../../lib/auth/runner'
import { prisma } from '../../../../lib/prisma'
import { verifyStoryToken, sanitizeText } from '../../../../lib/security'
import { del } from '@vercel/blob'

export const dynamic = 'force-dynamic'

const MAX_CONTENT_LENGTH = 2000

async function canModifyStory(token: string | null | undefined, story: { authorId: string | null; editTokenHash: string | null }) {
  if (verifyStoryToken(token, story.editTokenHash)) return true
  if (story.authorId) {
    const runner = await getCurrentRunner().catch(() => null)
    if (runner?.id && runner.id === story.authorId) return true
  }
  return false
}

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

    if (typeof rawContent !== 'string' || !rawContent.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (rawContent.trim().length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `Stories can be up to ${MAX_CONTENT_LENGTH} characters.` }, { status: 400 })
    }

    const story = await prisma.clubStory.findUnique({
      where: { id: storyId },
      select: { id: true, authorId: true, editTokenHash: true },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const isAuthorized = await canModifyStory(token, story)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to edit this story' }, { status: 401 })
    }

    const sanitized = sanitizeText(rawContent, MAX_CONTENT_LENGTH)
    if (!sanitized) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const updated = await prisma.clubStory.update({
      where: { id: storyId },
      data: { content: sanitized },
      include: { author: { select: { name: true, initials: true } } },
    })

    const authorName = updated.author?.name || updated.authorName || 'Runner'
    const authorInitials = updated.author?.initials || authorName.split(/\s+/).map((p: string) => p[0]).join('').toUpperCase() || 'R'

    return NextResponse.json({
      success: true,
      story: {
        id: updated.id,
        content: updated.content,
        createdAt: updated.createdAt.toISOString(),
        authorName,
        authorInitials,
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
      select: { id: true, authorId: true, editTokenHash: true, imagePath: true },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const isAuthorized = await canModifyStory(token, story)
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

import { del, put } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../lib/auth/runner'
import { hasDatabaseConfig, prisma } from '../../../lib/prisma'
import { generateStoryToken, sanitizeText } from '../../../lib/security'
import { getIP, createRateLimiter } from '../../../lib/rateLimit'

const MAX_CONTENT_LENGTH = 2000
const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const MAX_STORIES_PER_HOUR = 10

const storyPostLimiter = createRateLimiter(60 * 60 * 1000, MAX_STORIES_PER_HOUR)

type StoryWithAuthor = {
  id: string
  authorId: string | null
  authorName: string | null
  content: string
  imagePath: string | null
  likesCount: number
  createdAt: Date
  author: { name: string | null; initials: string | null } | null
}

function serializeStory(story: StoryWithAuthor, viewerRunnerId: string | null) {
  const name = story.author?.name?.trim() || story.authorName?.trim() || 'Runner'
  const initials = story.author?.initials?.trim() || name.split(/\s+/).map(part => part[0]).join('').toUpperCase()

  return {
    id: story.id,
    content: story.content,
    createdAt: story.createdAt.toISOString(),
    authorName: name,
    authorInitials: initials || 'R',
    photoUrl: story.imagePath ? `/api/stories/${story.id}/image` : null,
    isMine: viewerRunnerId && story.authorId ? story.authorId === viewerRunnerId : false,
    likesCount: story.likesCount || 0,
  }
}

function getImageExtension(type: string, bytes: Uint8Array) {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const isPng = type === 'image/png' && pngSignature.every((byte, index) => bytes[index] === byte)
  const isJpeg = type === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xff
  const header = new TextDecoder().decode(bytes.slice(0, 12))
  const isWebp = type === 'image/webp' && header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP'

  if (isPng) return 'png'
  if (isJpeg) return 'jpg'
  if (isWebp) return 'webp'
  return null
}

export async function GET(request: NextRequest) {
  let viewerRunnerId: string | null = null
  try {
    const runner = await getCurrentRunner()
    viewerRunnerId = runner?.id ?? null
  } catch {
    viewerRunnerId = null
  }

  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') || 50)
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 50

  try {
    const stories = await prisma.clubStory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: { select: { name: true, initials: true } },
      },
    })

    return NextResponse.json({
      stories: stories.map((story: any) => serializeStory(story, viewerRunnerId))
    })
  } catch {
    return NextResponse.json({ error: 'Stories are not available right now.' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 })
  }

  const ip = getIP(request)
  const rateCheck = storyPostLimiter.check(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'You have shared several stories recently. Try again later.' }, { status: 429 })
  }

  const runner = await getCurrentRunner().catch(() => null)

  const requestSize = Number(request.headers.get('content-length') || 0)
  if (requestSize > MAX_PHOTO_SIZE + 128 * 1024) {
    return NextResponse.json({ error: 'The photo must be smaller than 5 MB.' }, { status: 413 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Could not read the story form.' }, { status: 400 })
  }

  const rawContent = String(formData.get('content') || '')
  const content = sanitizeText(rawContent, MAX_CONTENT_LENGTH)
  if (!content) return NextResponse.json({ error: 'Add a few words before sharing.' }, { status: 400 })

  // Author display name: from logged in runner, or typed name in form, or "Club Runner"
  const typedName = sanitizeText(String(formData.get('authorName') || ''), 50)
  const authorDisplayName = runner?.name || typedName || 'Runner'

  const photoEntry = formData.get('photo')
  const photo = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null
  let imageExtension: string | null = null

  if (photo) {
    if (photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: 'The photo must be smaller than 5 MB.' }, { status: 413 })
    }

    const imageBytes = new Uint8Array(await photo.arrayBuffer())
    imageExtension = getImageExtension(photo.type, imageBytes)
    if (!imageExtension) {
      return NextResponse.json({ error: 'Use a valid JPG, PNG, or WebP image.' }, { status: 400 })
    }
  }

  let uploadedUrl: string | null = null
  let imagePath: string | null = null

  try {
    if (photo && imageExtension) {
      const blobId = runner?.id || 'community'
      const blob = await put(`club-stories/${blobId}/${randomUUID()}.${imageExtension}`, photo, {
        access: 'public',
      })
      uploadedUrl = blob.url
      imagePath = blob.url
    }

    // Generate secret edit token for this story
    const { plainToken, hashedToken } = generateStoryToken()

    const story = await prisma.clubStory.create({
      data: {
        authorId: runner?.id ?? null,
        authorName: authorDisplayName,
        content,
        imagePath,
        editTokenHash: hashedToken,
      },
      include: { author: { select: { name: true, initials: true } } },
    })

    return NextResponse.json(
      {
        story: serializeStory(story as any, runner?.id ?? null),
        editToken: plainToken,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[Stories POST error]:', err)
    if (uploadedUrl) await del(uploadedUrl).catch(() => undefined)
    return NextResponse.json({ error: err?.message || 'Your story could not be shared right now.' }, { status: 503 })
  }
}

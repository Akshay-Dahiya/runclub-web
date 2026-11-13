import { del, put } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../lib/auth/runner'
import { hasDatabaseConfig, prisma } from '../../../lib/prisma'

const MAX_CONTENT_LENGTH = 2000
const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const MAX_STORIES_PER_HOUR = 5

type StoryWithAuthor = {
  id: string
  authorId: string
  content: string
  imagePath: string | null
  createdAt: Date
  author: { name: string | null; initials: string | null }
}

function serializeStory(story: StoryWithAuthor, viewerRunnerId: string) {
  const name = story.author.name?.trim() || 'Runner'
  const initials = story.author.initials?.trim() || name.split(/\s+/).map(part => part[0]).join('').toUpperCase()

  return {
    id: story.id,
    content: story.content,
    createdAt: story.createdAt.toISOString(),
    authorName: name,
    authorInitials: initials || 'R',
    photoUrl: story.imagePath ? `/api/stories/${story.id}/image` : null,
    isMine: story.authorId === viewerRunnerId,
  }
}

function getImageExtension(type: string, bytes: Uint8Array) {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const isPng = type === 'image/png' && pngSignature.every((byte, index) => bytes[index] === byte)
  const isJpeg = type === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const header = new TextDecoder().decode(bytes.slice(0, 12))
  const isWebp = type === 'image/webp' && header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP'

  if (isPng) return 'png'
  if (isJpeg) return 'jpg'
  if (isWebp) return 'webp'
  return null
}

type AuthenticatedRunner = NonNullable<Awaited<ReturnType<typeof getCurrentRunner>>>
type RunnerAuthResult =
  | { runner: AuthenticatedRunner; response: null }
  | { runner: null; response: NextResponse }

async function getAuthenticatedRunner(): Promise<RunnerAuthResult> {
  if (!hasDatabaseConfig()) {
    return { runner: null, response: NextResponse.json({ error: 'Stories are not configured for this environment.' }, { status: 503 }) }
  }

  try {
    const runner = await getCurrentRunner()
    if (!runner) {
      return { runner: null, response: NextResponse.json({ error: 'Connect with Strava to access club stories.' }, { status: 401 }) }
    }
    return { runner, response: null }
  } catch {
    return { runner: null, response: NextResponse.json({ error: 'Stories are not available right now.' }, { status: 503 }) }
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedRunner()
  if (auth.response) return auth.response
  const runner = auth.runner

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

    return NextResponse.json({ stories: stories.map((story: StoryWithAuthor) => serializeStory(story, runner.id)) })
  } catch {
    return NextResponse.json({ error: 'Stories are not available right now.' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedRunner()
  if (auth.response) return auth.response
  const runner = auth.runner

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

  const content = String(formData.get('content') || '').trim()
  if (!content) return NextResponse.json({ error: 'Add a few words before sharing.' }, { status: 400 })
  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: `Stories can be up to ${MAX_CONTENT_LENGTH} characters.` }, { status: 400 })
  }

  const photoEntry = formData.get('photo')
  if (typeof photoEntry === 'string' && photoEntry) {
    return NextResponse.json({ error: 'Choose an image file for the photo.' }, { status: 400 })
  }

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

  try {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentPosts = await prisma.clubStory.count({
      where: { authorId: runner.id, createdAt: { gte: hourAgo } },
    })
    if (recentPosts >= MAX_STORIES_PER_HOUR) {
      return NextResponse.json({ error: 'You have shared several stories recently. Try again in an hour.' }, { status: 429 })
    }
  } catch {
    return NextResponse.json({ error: 'Stories are not available right now.' }, { status: 503 })
  }

  let uploadedUrl: string | null = null
  let imagePath: string | null = null

  try {
    if (photo && imageExtension) {
      const blob = await put(`club-stories/${runner.id}/${randomUUID()}.${imageExtension}`, photo, {
        access: 'private',
      })
      uploadedUrl = blob.url
      imagePath = blob.pathname
    }

    const story = await prisma.clubStory.create({
      data: { authorId: runner.id, content, imagePath },
      include: { author: { select: { name: true, initials: true } } },
    })

    return NextResponse.json({ story: serializeStory(story, runner.id) }, { status: 201 })
  } catch {
    if (uploadedUrl) await del(uploadedUrl).catch(() => undefined)
    return NextResponse.json({ error: 'Your story could not be shared right now.' }, { status: 503 })
  }
}

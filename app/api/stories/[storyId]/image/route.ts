import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { hasDatabaseConfig, prisma } from '../../../../../lib/prisma'

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
}

// Ensure storyId only contains safe identifier characters (cuid, uuid, or alphanumeric)
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> },
) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: 'Stories are not configured for this environment.' }, { status: 503 })
  }

  try {
    const { storyId } = await params
    if (!storyId || !SAFE_ID_REGEX.test(storyId)) {
      return NextResponse.json({ error: 'Invalid story identifier.' }, { status: 400 })
    }

    const story = await prisma.clubStory.findUnique({
      where: { id: storyId },
      select: { imagePath: true },
    })
    if (!story?.imagePath) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 })

    // Path traversal / scope protection:
    // Only serve paths that belong to club-stories and have a valid image extension.
    // Rejects directory traversal (../, ..\, null bytes, absolute paths outside club-stories).
    const isBlobUrl = story.imagePath.startsWith('https://') && story.imagePath.includes('.public.blob.vercel-storage.com')
    const isRelativeClubPath = /^club-stories\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(story.imagePath)

    if (!isBlobUrl && !isRelativeClubPath) {
      return NextResponse.json({ error: 'Invalid story image path.' }, { status: 403 })
    }

    // Explicitly reject any SVG references
    if (story.imagePath.toLowerCase().endsWith('.svg') || story.imagePath.toLowerCase().includes('.svg?')) {
      return NextResponse.json({ error: 'Unsupported image format.' }, { status: 415 })
    }

    const result = await get(story.imagePath, {
      access: 'public',
      ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
    })
    if (!result) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 })

    // Validate returned content-type: strictly JPEG, PNG, or WebP. SVG or XML must be rejected.
    const rawContentType = (result.blob.contentType || '').toLowerCase().split(';')[0].trim()
    const validatedContentType = ALLOWED_CONTENT_TYPES[rawContentType]

    if (!validatedContentType || rawContentType.includes('svg') || rawContentType.includes('xml') || rawContentType.includes('html')) {
      return NextResponse.json({ error: 'Unsupported media type.' }, { status: 415 })
    }

    const headers = {
      'Cache-Control': 'public, max-age=3600',
      ETag: result.blob.etag,
      'X-Content-Type-Options': 'nosniff',
    }

    if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers })

    return new NextResponse(result.stream, {
      headers: { ...headers, 'Content-Type': validatedContentType },
    })
  } catch {
    return NextResponse.json({ error: 'Photo is not available right now.' }, { status: 503 })
  }
}

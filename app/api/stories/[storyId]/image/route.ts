import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../../../lib/auth/runner'
import { hasDatabaseConfig, prisma } from '../../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> },
) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: 'Stories are not configured for this environment.' }, { status: 503 })
  }

  try {
    const runner = await getCurrentRunner()
    if (!runner) return NextResponse.json({ error: 'Connect with Strava to view this photo.' }, { status: 401 })

    const { storyId } = await params
    const story = await prisma.clubStory.findUnique({
      where: { id: storyId },
      select: { imagePath: true },
    })
    if (!story?.imagePath) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 })

    const result = await get(story.imagePath, {
      access: 'private',
      ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
    })
    if (!result) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 })

    const headers = {
      'Cache-Control': 'private, no-cache',
      ETag: result.blob.etag,
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Cookie',
    }

    if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers })

    return new NextResponse(result.stream, {
      headers: { ...headers, 'Content-Type': result.blob.contentType },
    })
  } catch {
    return NextResponse.json({ error: 'Photo is not available right now.' }, { status: 503 })
  }
}

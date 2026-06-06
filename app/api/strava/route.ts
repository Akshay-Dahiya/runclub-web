import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

// Redirect user to Strava OAuth
export async function GET(req: Request) {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: process.env.STRAVA_REDIRECT_URI || 'http://localhost:3000/api/strava/callback',
    scope: 'activity:read_all'
  })
  const url = `https://www.strava.com/oauth/authorize?${params.toString()}`
  return NextResponse.redirect(url)
}

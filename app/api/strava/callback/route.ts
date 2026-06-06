import { NextResponse } from 'next/server'
import axios from 'axios'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const tokenResp = await axios.post('https://www.strava.com/oauth/token', {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code'
  })

  const data = tokenResp.data
  // TODO: associate with authenticated user - placeholder
  // Create a ConnectedAccount for the token
  // In a real app, use session to map to user
  await prisma.connectedAccount.create({
    data: {
      provider: 'strava',
      providerId: String(data.athlete?.id || ''),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      user: {
        connect: { email: 'alice@example.com' }
      }
    }
  })

  return NextResponse.redirect('/')
}

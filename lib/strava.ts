import { prisma } from './prisma'

/**
 * Ensures the member's Strava access token is fresh.
 * If expired (or expiring in the next 60 seconds), it executes a refresh request to Strava
 * and persists the updated tokens in the database.
 * Returns the fresh access token string.
 */
export async function refreshStravaToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      strava_access_token: true,
      strava_refresh_token: true,
      strava_token_expires_at: true,
    }
  })

  if (!user || !user.strava_access_token || !user.strava_refresh_token) {
    throw new Error('User is not connected to Strava')
  }

  const now = new Date()
  const expiresAt = user.strava_token_expires_at

  // If the token is still valid (with 60 seconds buffer), return it
  if (expiresAt && expiresAt.getTime() - now.getTime() > 60 * 1000) {
    return user.strava_access_token
  }

  console.log(`[Strava] Token for user ${userId} expired/expiring soon. Refreshing...`)

  // Token is expired or expiring soon, refresh it
  const resp = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: user.strava_refresh_token,
    })
  })

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => null)
    throw new Error(`Failed to refresh Strava token: ${JSON.stringify(errorData)}`)
  }

  const data = await resp.json()

  // Save the new access token, refresh token, and expiration time to DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      strava_access_token: data.access_token,
      strava_refresh_token: data.refresh_token,
      strava_token_expires_at: new Date(data.expires_at * 1000),
    }
  })

  return data.access_token
}

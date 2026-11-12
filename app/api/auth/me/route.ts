import { NextResponse } from 'next/server'
import { getCurrentRunner } from '../../../../lib/auth/runner'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const runner = await getCurrentRunner()
    if (!runner) return NextResponse.json({ error: 'Connect Strava to continue' }, { status: 401 })
    return NextResponse.json({ runner }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Runner session lookup failed:', error)
    return NextResponse.json({ error: 'Could not load runner account' }, { status: 500 })
  }
}

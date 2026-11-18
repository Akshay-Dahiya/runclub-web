import { NextResponse } from 'next/server'
import { authorizeRunnerRequest } from '../../../../lib/auth/runner'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const auth = await authorizeRunnerRequest(req)
    if (auth.response) return auth.response
    return NextResponse.json({ runner: auth.runner }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Runner session lookup failed:', error)
    return NextResponse.json({ error: 'Could not load runner account' }, { status: 500 })
  }
}

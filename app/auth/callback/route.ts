import { getCurrentRunner } from '../../../lib/auth/runner'
import { getSupabaseConfig } from '../../../lib/supabase/config'
import { createClient } from '../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  if (!getSupabaseConfig()) {
    return NextResponse.redirect(new URL('/login?unavailable=1', origin))
  }
  if (!code) return NextResponse.redirect(new URL('/login?error=callback', origin))

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL('/login?error=callback', origin))

  try {
    const runner = await getCurrentRunner()
    if (!runner) return NextResponse.redirect(new URL('/signup?error=profile', origin))

    const requestedNext = searchParams.get('next')
    const candidate = requestedNext ? new URL(requestedNext, origin) : null
    const destination = candidate?.origin === origin
      && candidate.pathname.startsWith('/')
      && !candidate.pathname.startsWith('//')
      ? candidate
      : new URL(`/dashboard/${runner.id}`, origin)

    return NextResponse.redirect(destination)
  } catch (callbackError) {
    console.error('Runner account callback failed:', callbackError)
    return NextResponse.redirect(new URL('/signup?error=profile', origin))
  }
}

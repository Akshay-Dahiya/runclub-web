import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from './lib/session'
import { updateSession } from './lib/supabase/proxy'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }
    const response = NextResponse.next()
    const session = await getIronSession<SessionData>(request, response, sessionOptions)
    if (!session.isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return response
  }

  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}

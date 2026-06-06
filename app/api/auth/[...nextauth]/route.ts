import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import NextAuth from 'next-auth'

// Adapter to NextAuth in App Router
const handler = NextAuth(authOptions as any)
export { handler as GET, handler as POST }

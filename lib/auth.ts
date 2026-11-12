import type { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const providers: AuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Email and password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase()
      const password = credentials?.password
      if (!email || !password) return null
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) return null
      return { id: user.id, email: user.email, name: user.name }
    },
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }))
}

export const authOptions: AuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true
      if (!user.email) return false
      const existing = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() }, select: { id: true } })
      return Boolean(existing)
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const accountUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true },
        })
        if (accountUser) token.runclubUserId = accountUser.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && typeof token.runclubUserId === 'string') {
        ;(session.user as typeof session.user & { id: string }).id = token.runclubUserId
      }
      return session
    },
  },
}

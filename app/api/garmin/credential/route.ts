import { createHash, randomBytes } from 'node:crypto'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Sign in to the matching RunClub account first.' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'RunClub account not found.' }, { status: 404 })

  const token = randomBytes(32).toString('base64url')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  await prisma.garminIngestCredential.upsert({
    where: { userId },
    create: { userId, tokenHash },
    update: { tokenHash },
  })
  return NextResponse.json({ token, warning: 'Copy this token now. It is shown once and is not your Garmin password.' })
}

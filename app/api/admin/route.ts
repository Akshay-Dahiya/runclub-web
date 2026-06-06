import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const totalDistance = await prisma.run.aggregate({ _sum: { distanceKm: true } })
  const activeUsers = await prisma.user.count()
  return NextResponse.json({ totalDistance: totalDistance._sum.distanceKm || 0, activeUsers })
}

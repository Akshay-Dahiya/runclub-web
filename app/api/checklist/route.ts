import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { userId, itemKey, checked } = await req.json()
  if (!userId || !itemKey) {
    return NextResponse.json({ error: 'Missing userId or itemKey' }, { status: 400 })
  }
  const item = await prisma.checklistItem.upsert({
    where: { userId_itemKey: { userId, itemKey } },
    update: { checked },
    create: { userId, itemKey, checked },
  })
  return NextResponse.json(item)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json([], { status: 400 })
  const items = await prisma.checklistItem.findMany({ where: { userId } })
  return NextResponse.json(items)
}

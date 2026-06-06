import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  const runs = await prisma.run.findMany({ where: userId ? { userId } : undefined, orderBy: { date: 'desc' } })
  return NextResponse.json(runs)
}

export async function POST(req: Request) {
  const body = await req.json()
  const run = await prisma.run.create({ data: body })
  return NextResponse.json(run)
}

export async function PUT(req: Request) {
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const run = await prisma.run.update({ where: { id: body.id }, data: body })
  return NextResponse.json(run)
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.run.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

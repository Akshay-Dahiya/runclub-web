import { createHash, timingSafeEqual } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function numberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization') || ''
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (bearer.length < 32) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tokenHash = createHash('sha256').update(bearer).digest('hex')
  const credential = await prisma.garminIngestCredential.findUnique({ where: { tokenHash } })
  if (!credential) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const expected = Buffer.from(credential.tokenHash, 'hex')
  const supplied = Buffer.from(tokenHash, 'hex')
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!isRecord(payload) || !Array.isArray(payload.activities) || !Array.isArray(payload.wellness)) {
    return NextResponse.json({ error: 'Expected activities and wellness arrays' }, { status: 400 })
  }

  let imported = 0
  let updated = 0
  let wellnessUpserted = 0

  for (const raw of payload.activities) {
    if (!isRecord(raw)) continue
    const type = String(raw.activityType || '').toLowerCase().replaceAll('-', '_')
    if (!['running', 'run', 'trail_running', 'trail_run', 'treadmill_running', 'track_running'].includes(type)) continue
    const externalId = String(raw.activityId || '').slice(0, 100)
    const distanceKm = numberOrNull(raw.distanceKm)
    const durationSec = numberOrNull(raw.durationSec)
    const date = new Date(String(raw.date || ''))
    if (!externalId || !distanceKm || distanceKm <= 0 || !durationSec || durationSec <= 0 || !Number.isFinite(date.getTime())) continue

    const runData = {
      date,
      distanceKm,
      durationSec: Math.round(durationSec),
      paceSecPerKm: Math.round(durationSec / distanceKm),
      avgHeartRate: numberOrNull(raw.avgHeartRate) === null ? null : Math.round(numberOrNull(raw.avgHeartRate)!),
      elevationGain: numberOrNull(raw.elevationGain),
      notes: typeof raw.name === 'string' ? raw.name.slice(0, 200) : 'Garmin run',
      source: 'garmin',
    }

    const result = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const existing = await transaction.garminActivity.findUnique({
        where: { userId_externalId: { userId: credential.userId, externalId } },
        select: { id: true, runId: true },
      })
      let runId = existing?.runId ?? null
      if (!runId) {
        const tolerance = Math.max(0.1, distanceKm * 0.02)
        const candidates = await transaction.run.findMany({
          where: {
            userId: credential.userId,
            date: { gte: new Date(date.getTime() - 5 * 60_000), lte: new Date(date.getTime() + 5 * 60_000) },
            distanceKm: { gte: Math.max(0, distanceKm - tolerance), lte: distanceKm + tolerance },
          },
          select: { id: true, date: true },
        })
        runId = candidates.sort((left, right) =>
          Math.abs(left.date.getTime() - date.getTime()) - Math.abs(right.date.getTime() - date.getTime()),
        )[0]?.id ?? null
      }
      if (!runId) {
        const run = await transaction.run.create({ data: { ...runData, userId: credential.userId }, select: { id: true } })
        runId = run.id
      }
      const activityData = { userId: credential.userId, externalId, runId, date, data: runData }
      await transaction.garminActivity.upsert({
        where: { userId_externalId: { userId: credential.userId, externalId } },
        create: activityData,
        update: { runId, date, data: runData },
      })
      return existing ? 'updated' : 'imported'
    })
    if (result === 'updated') updated += 1
    else imported += 1
  }

  for (const raw of payload.wellness) {
    if (!isRecord(raw)) continue
    const dateText = String(raw.date || '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) continue
    const date = new Date(`${dateText}T00:00:00.000Z`)
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dateText) continue
    const data = {
      sleepHours: numberOrNull(raw.sleepHours),
      sleepScore: numberOrNull(raw.sleepScore),
      hrvMs: numberOrNull(raw.hrvMs),
      restingHeartRate: numberOrNull(raw.restingHeartRate),
      bodyBatteryStart: numberOrNull(raw.bodyBatteryStart),
      bodyBatteryEnd: numberOrNull(raw.bodyBatteryEnd),
      averageStress: numberOrNull(raw.averageStress),
      steps: numberOrNull(raw.steps),
      trainingReadiness: numberOrNull(raw.trainingReadiness),
    }
    await prisma.garminDailyMetric.upsert({
      where: { userId_date: { userId: credential.userId, date } },
      create: { userId: credential.userId, date, data },
      update: { data },
    })
    wellnessUpserted += 1
  }

  return NextResponse.json({ imported, updated, wellnessUpserted })
}

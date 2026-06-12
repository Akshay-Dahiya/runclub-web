import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '../../../lib/session'
import { cookies } from 'next/headers'
import { prisma } from '../../../lib/prisma'
import { PARTICIPANTS, getPlan, plannedKmSoFar, grandTotal, currentWeekIdx, WEEK_STARTS } from '../../../lib/planData'

export const dynamic = 'force-dynamic'


// ─── GET: Dashboard stats ────────────────────────────────────────────────────
export async function GET(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'stats') {
    const allUsers = await prisma.user.findMany({ include: { runs: true } })
    const allRuns = await prisma.run.findMany({ orderBy: { date: 'desc' }, include: { user: true } })

    // This week bounds (Mon–Sun)
    const now = new Date()
    const dayOfWeek = (now.getDay() + 6) % 7 // Mon=0 Sun=6
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const runsThisWeek = allRuns.filter((r: any) => new Date(r.date) >= weekStart && new Date(r.date) < weekEnd)
    const kmThisWeek = runsThisWeek.reduce((s: number, r: any) => s + r.distanceKm, 0)

    // Runners who haven't logged anything this week
    const runnersWithRunsThisWeek = new Set(runsThisWeek.map((r: any) => r.userId))
    const allRunnerIds = allUsers.map((u: any) => u.id)
    const notRunThisWeek = allUsers
      .filter((u: any) => !runnersWithRunsThisWeek.has(u.id))
      .map((u: any) => u.name || u.email)

    // Runners behind by 20%+
    const behindRunners = allUsers.map((u: any) => {
      const staticPart = PARTICIPANTS.find(p => p.email === u.email)
      const name = u.name || staticPart?.name || 'Unknown'
      const initials = u.initials || staticPart?.initials || name.split(' ').map((w: string) => w[0]).join('').toUpperCase()
      
      let cat = staticPart?.cat || '10K'
      if (u.runningGoal) {
        if (u.runningGoal === '10.5K Run' || u.runningGoal === '10K') cat = '10K'
        else if (u.runningGoal === '21.1K Half Marathon' || u.runningGoal === 'HM' || u.runningGoal === 'HM_BEG') cat = 'HM_BEG'
        else if (u.runningGoal === 'HM_INT' || u.runningGoal === 'HM Intermediate') cat = 'HM_INT'
      }
      const updatedParticipant = {
        id: u.id,
        name,
        initials,
        email: u.email,
        cat
      }
      const actualKm = u.runs.reduce((s: number, r: any) => s + r.distanceKm, 0)
      const planned = plannedKmSoFar(updatedParticipant)
      if (planned === 0) return null
      const pct = (actualKm / planned) * 100
      if (pct < 80) return { name, pct: Math.round(pct), gap: (planned - actualKm).toFixed(1) }
      return null
    }).filter(Boolean)

    return NextResponse.json({
      totalRunners: allUsers.length,
      totalRuns: allRuns.length,
      totalKm: allRuns.reduce((s: number, r: any) => s + r.distanceKm, 0).toFixed(1),
      runsThisWeek: runsThisWeek.length,
      kmThisWeek: kmThisWeek.toFixed(1),
      notRunThisWeek,
      behindRunners,
    })
  }

  if (action === 'allRuns') {
    const runs = await prisma.run.findMany({
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true, email: true } } },
      take: 500,
    })
    return NextResponse.json(runs)
  }

  if (action === 'allRunners') {
    const users = await prisma.user.findMany({
      include: { runs: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(users)
  }

  if (action === 'note') {
    const note = await prisma.adminNote.findFirst({ orderBy: { updatedAt: 'desc' } })
    return NextResponse.json({ content: note?.content || '' })
  }

  if (action === 'planOverrides') {
    const overrides = await prisma.planOverride.findMany()
    return NextResponse.json(overrides)
  }

  // Default stats
  const totalDistance = await prisma.run.aggregate({ _sum: { distanceKm: true } })
  const activeUsers = await prisma.user.count()
  return NextResponse.json({ totalDistance: totalDistance._sum.distanceKm || 0, activeUsers })
}

// ─── POST: All mutations ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  const body = await req.json()
  const { action } = body

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Add Runner ──
  if (action === 'addRunner') {
    const { name, plan, initials } = body
    if (!name || !plan) return NextResponse.json({ error: 'Missing name or plan' }, { status: 400 })
    const email = `admin_${Date.now()}@runclub.local`
    const user = await prisma.user.create({
      data: { name, email, initials: initials || name.split(' ').map((w: string) => w[0]).join('').toUpperCase(), runningGoal: plan }
    })
    return NextResponse.json(user)
  }

  // ── Edit Runner ──
  if (action === 'editRunner') {
    const { userId, name, plan, initials } = body
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, runningGoal: plan, initials }
    })
    return NextResponse.json(user)
  }

  // ── Delete Runner ──
  if (action === 'deleteRunner') {
    const { userId } = body
    await prisma.run.deleteMany({ where: { userId } })
    await prisma.checklistItem.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ ok: true })
  }

  // ── Delete Run ──
  if (action === 'deleteRun') {
    const { runId } = body
    await prisma.run.delete({ where: { id: runId } })
    return NextResponse.json({ ok: true })
  }

  // ── Add Run for any runner ──
  if (action === 'addRun') {
    const { userId, date, distanceKm, paceSecPerKm, durationSec, notes, avgHeartRate } = body
    
    // Server-side validation (Section 4)
    if (!userId) return NextResponse.json({ error: 'Invalid member' }, { status: 400 })
    
    const dist = parseFloat(distanceKm)
    if (!dist || dist <= 0 || dist > 100) return NextResponse.json({ error: 'Distance must be between 0.01 and 100 km' }, { status: 400 })
    
    const runDate = new Date(date)
    if (isNaN(runDate.getTime()) || runDate > new Date()) return NextResponse.json({ error: 'Date cannot be in the future' }, { status: 400 })
    
    if (paceSecPerKm && (paceSecPerKm < 120 || paceSecPerKm > 1200)) return NextResponse.json({ error: 'Pace must be reasonable' }, { status: 400 })
    if (avgHeartRate && (parseInt(avgHeartRate) < 40 || parseInt(avgHeartRate) > 220)) return NextResponse.json({ error: 'Heart rate must be between 40 and 220 bpm' }, { status: 400 })

    // Duplicate check
    const existing = await prisma.run.findFirst({
      where: {
        userId,
        date: runDate,
        distanceKm: dist,
        createdAt: { gte: new Date(Date.now() - 60000) }
      }
    })
    
    if (existing) {
      return NextResponse.json({ error: 'Duplicate run detected. This run was not saved again.' }, { status: 409 })
    }

    const run = await prisma.run.create({
      data: {
        userId, date: runDate,
        distanceKm: dist,
        durationSec: durationSec || Math.round(dist * (paceSecPerKm || 360)),
        paceSecPerKm: paceSecPerKm || Math.round((durationSec || 0) / dist),
        notes: notes || null,
        avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : null,
      }
    })
    return NextResponse.json(run)
  }

  // ── Save Admin Note ──
  if (action === 'saveNote') {
    const existing = await prisma.adminNote.findFirst()
    const note = existing
      ? await prisma.adminNote.update({ where: { id: existing.id }, data: { content: body.content } })
      : await prisma.adminNote.create({ data: { content: body.content } })
    return NextResponse.json(note)
  }

  // ── Set Plan Override ──
  if (action === 'setPlanOverride') {
    const { plan, week, day, km } = body
    const override = await prisma.planOverride.upsert({
      where: { plan_week_day: { plan, week, day } },
      update: { km },
      create: { plan, week, day, km }
    })
    return NextResponse.json(override)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

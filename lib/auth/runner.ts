import type { User as SupabaseUser } from '@supabase/supabase-js'
import { prisma } from '../prisma'
import { createClient } from '../supabase/server'
import { getSupabaseConfig } from '../supabase/config'

const runnerSelect = {
  id: true,
  email: true,
  name: true,
  initials: true,
  runningGoal: true,
  strava_connected: true,
  last_synced_at: true,
} as const

const allowedGoals = new Set([
  '10K',
  '10.5K Run',
  'HM',
  'HM_BEG',
  'HM_INT',
  '21.1K Half Marathon',
  'HM Intermediate',
])

function getProfileName(user: SupabaseUser) {
  const metadata = user.user_metadata as Record<string, unknown> | null
  const value = metadata?.full_name ?? metadata?.name
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
}

function getProfileGoal(user: SupabaseUser) {
  const metadata = user.user_metadata as Record<string, unknown> | null
  const value = metadata?.running_goal
  return typeof value === 'string' && allowedGoals.has(value) ? value : '10.5K Run'
}

export async function ensureRunnerProfile(user: SupabaseUser) {
  if (!user.email || !user.email_confirmed_at) return null

  const email = user.email.trim().toLowerCase()
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: runnerSelect,
  })
  if (existing) return existing

  const name = getProfileName(user)
  if (!name) return null

  const initials = name
    .split(/\s+/)
    .slice(0, 3)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  try {
    return await prisma.user.create({
      data: {
        email,
        name,
        initials: initials || 'RR',
        runningGoal: getProfileGoal(user),
      },
      select: runnerSelect,
    })
  } catch (error) {
    const createdByConcurrentRequest = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: runnerSelect,
    })
    if (createdByConcurrentRequest) return createdByConcurrentRequest
    throw error
  }
}

export async function getCurrentRunner() {
  if (!getSupabaseConfig()) return null

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return ensureRunnerProfile(data.user)
}

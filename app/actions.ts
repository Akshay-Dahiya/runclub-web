"use server"

import { prisma } from '../lib/prisma'
import { revalidatePath } from 'next/cache'

export async function logRun(formData: FormData) {
  const email = formData.get('email') as string
  const distanceKm = parseFloat(formData.get('distance') as string)
  const dateStr = formData.get('date') as string
  const pace = formData.get('pace') as string // "5:30" format
  const duration = formData.get('duration') as string // "45:00" format
  const hrStr = formData.get('heartRate') as string
  const avgHeartRate = hrStr ? parseInt(hrStr, 10) : null

  if (!email || !distanceKm || !dateStr) {
    throw new Error('Missing required fields')
  }

  const parsePaceToSec = (timeStr: string) => {
    const clean = timeStr.trim().replace(/\./g, ':')
    if (clean.includes(':')) {
      const parts = clean.split(':').map(Number)
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
      if (parts.length === 2) return parts[0] * 60 + parts[1] // MM:SS
    }
    return parseInt(clean, 10) * 60 || 0
  }

  const parseDurationToSec = (timeStr: string, dist: number) => {
    const clean = timeStr.trim().replace(/\./g, ':')
    if (clean.includes(':')) {
      const parts = clean.split(':').map(Number)
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2] // HH:MM:SS
      if (parts.length === 2) {
        const optionA = parts[0] * 3600 + parts[1] * 60 // HH:MM
        const optionB = parts[0] * 60 + parts[1] // MM:SS
        const paceA = dist > 0 ? optionA / dist : 0
        const paceB = dist > 0 ? optionB / dist : 0
        const realisticA = paceA >= 150 && paceA <= 900
        const realisticB = paceB >= 150 && paceB <= 900
        if (realisticA && !realisticB) return optionA
        if (realisticB && !realisticA) return optionB
        if (parts[0] >= 3) return optionB
        return optionA
      }
    }
    return parseInt(clean, 10) * 60 || 0
  }

  let paceSecPerKm = 0
  let durationSec = 0

  if (pace && !duration) {
    paceSecPerKm = parsePaceToSec(pace)
    durationSec = Math.round(distanceKm * paceSecPerKm)
  } else if (duration && !pace) {
    durationSec = parseDurationToSec(duration, distanceKm)
    paceSecPerKm = Math.round(durationSec / distanceKm)
  } else {
    // Both provided
    durationSec = parseDurationToSec(duration, distanceKm)
    paceSecPerKm = parsePaceToSec(pace)
  }

  try {
    const queryPromise = prisma.user.findUnique({ where: { email } })
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Prisma connection timeout')), 15000)
    )
    const user: any = await Promise.race([queryPromise, timeoutPromise])
    if (!user) {
      throw new Error('User not found')
    }

    // Deduplication safeguard
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)
    const recentDuplicate = await prisma.run.findFirst({
      where: {
        userId: user.id,
        distanceKm: distanceKm,
        date: new Date(dateStr),
        createdAt: {
          gte: thirtySecondsAgo
        }
      }
    })
    
    if (recentDuplicate) {
      throw new Error('This run looks like a duplicate. It was not saved again.')
    }

    await prisma.run.create({
      data: {
        userId: user.id,
        date: new Date(dateStr),
        distanceKm,
        durationSec,
        paceSecPerKm,
        avgHeartRate,
      }
    })
  } catch (error: any) {
    console.error("DB LogRun failed:", error)
    throw new Error(error?.message || 'Database write failed')
  }

  revalidatePath('/')
  return { success: true }
}

"use server"

import { prisma } from '../lib/prisma'
import { revalidatePath } from 'next/cache'

export async function logRun(formData: FormData) {
  const email = formData.get('email') as string
  const distanceKm = parseFloat(formData.get('distance') as string)
  const dateStr = formData.get('date') as string
  const pace = formData.get('pace') as string // "5:30" format
  const duration = formData.get('duration') as string // "45:00" format

  if (!email || !distanceKm || !dateStr) {
    throw new Error('Missing required fields')
  }
  
  if (!pace && !duration) {
    throw new Error('Please provide either Pace or Duration')
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

  const parseDurationToSec = (timeStr: string) => {
    const clean = timeStr.trim().replace(/\./g, ':')
    if (clean.includes(':')) {
      const parts = clean.split(':').map(Number)
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2] // HH:MM:SS
      if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60 // HH:MM
    }
    return parseInt(clean, 10) * 60 || 0
  }

  let paceSecPerKm = 0
  let durationSec = 0

  if (pace && !duration) {
    paceSecPerKm = parsePaceToSec(pace)
    durationSec = Math.round(distanceKm * paceSecPerKm)
  } else if (duration && !pace) {
    durationSec = parseDurationToSec(duration)
    paceSecPerKm = Math.round(durationSec / distanceKm)
  } else {
    // Both provided
    durationSec = parseDurationToSec(duration)
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

    await prisma.run.create({
      data: {
        userId: user.id,
        date: new Date(dateStr),
        distanceKm,
        durationSec,
        paceSecPerKm,
      }
    })
  } catch (error: any) {
    console.error("DB LogRun failed:", error)
    throw new Error(error?.message || 'Database write failed')
  }

  revalidatePath('/')
  return { success: true }
}

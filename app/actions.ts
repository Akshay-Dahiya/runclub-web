"use server"

import { prisma } from '../lib/prisma'
import { revalidatePath } from 'next/cache'

export async function logRun(formData: FormData) {
  const email = formData.get('email') as string
  const distanceKm = parseFloat(formData.get('distance') as string)
  const dateStr = formData.get('date') as string
  const pace = formData.get('pace') as string // "5:30" format

  if (!email || !distanceKm || !dateStr) {
    throw new Error('Missing required fields')
  }

  // Parse pace to seconds per km (support MM:SS, decimal minutes, and raw minutes)
  let paceSecPerKm = 330 // default 5:30
  if (pace) {
    const cleanPace = pace.trim()
    if (cleanPace.includes(':')) {
      const [min, sec] = cleanPace.split(':')
      paceSecPerKm = (parseInt(min, 10) || 0) * 60 + (parseInt(sec, 10) || 0)
    } else if (cleanPace.includes('.')) {
      const decimalPace = parseFloat(cleanPace)
      if (!isNaN(decimalPace)) {
        paceSecPerKm = Math.round(decimalPace * 60)
      }
    } else {
      const minutes = parseInt(cleanPace, 10)
      if (!isNaN(minutes)) {
        paceSecPerKm = minutes * 60
      }
    }
  }

  const durationSec = Math.round(distanceKm * paceSecPerKm)

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

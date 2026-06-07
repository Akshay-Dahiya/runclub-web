import React from 'react'
import { prisma } from '../../../lib/prisma'
import { PARTICIPANTS, plannedKmSoFar, getStatus, grandTotal } from '../../../lib/planData'
import DashboardClient from '../../../components/Dashboard/DashboardClient'
import { redirect } from 'next/navigation'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const participantId = parseInt(resolvedParams.id)
  const participantDef = PARTICIPANTS.find(p => p.id === participantId)

  if (!participantDef) {
    redirect('/')
  }

  const userEmail = participantDef.email || `placeholder_${participantId}@runclub.local`
  
  let dbUser = null
  try {
    const queryPromise = prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        runs: {
          orderBy: { date: 'desc' }
        }
      }
    })
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Prisma connection timeout')), 8000)
    )
    dbUser = await Promise.race([queryPromise, timeoutPromise])
  } catch (error) {
    console.error('Prisma connection failed on dashboard:', error)
  }

  if (!dbUser) {
    // Emergency Fallback: If DB times out, create a fake user so they don't get kicked out!
    dbUser = {
      name: participantDef.name,
      runs: []
    }
  }

  const actualKm = dbUser.runs.reduce((sum: number, r: any) => sum + (r.distanceKm || 0), 0)
  const plannedKm = plannedKmSoFar(participantDef as any)
  const status = getStatus(actualKm, participantDef as any)
  const pct = plannedKm > 0 ? Math.min(100, Math.round((actualKm / plannedKm) * 100)) : 0
  const totalTarget = grandTotal(participantDef as any)

  return (
    <>
      <Navbar />
      <div className="section" style={{ minHeight: '80vh', paddingTop: '100px' }}>
        <DashboardClient 
          dbUser={dbUser}
          participantDef={participantDef}
          actualKm={actualKm}
          plannedKm={plannedKm}
          status={status}
          pct={pct}
          totalTarget={totalTarget}
        />
      </div>
      <Footer />
    </>
  )
}

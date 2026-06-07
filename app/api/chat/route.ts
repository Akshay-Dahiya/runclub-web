import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { PARTICIPANTS } from '../../lib/planData'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { messages, userId, apiKey } = await req.json()

    if (!apiKey) {
      return new Response('Missing OpenAI API Key', { status: 400 })
    }

    if (!userId) {
      return new Response('Missing userId', { status: 400 })
    }

    const openai = createOpenAI({ apiKey })

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { runs: { orderBy: { date: 'desc' } } }
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    // Fetch all users for leaderboard context
    const allUsers = await prisma.user.findMany({
      include: { runs: true }
    })

    // Find the participant def
    const participantDef = PARTICIPANTS.find(p => p.id === userId) || { cat: 'HM', target: 21.1 }
    const totalTarget = participantDef.cat === 'HM' ? 250 : 150 // example targets

    // Calculate context data
    const totalKm = user.runs.reduce((sum, run) => sum + run.distanceKm, 0)
    const pct = Math.round((totalKm / totalTarget) * 100)
    
    // Recent runs text
    const recentRuns = user.runs.slice(0, 10).map(r => {
      const paceMin = Math.floor(r.paceSecPerKm / 60)
      const paceSec = String(r.paceSecPerKm % 60).padStart(2, '0')
      return `- ${new Date(r.date).toLocaleDateString()}: ${r.distanceKm}km at ${paceMin}:${paceSec}/km`
    }).join('\n')

    // Leaderboard logic
    const leaderboard = allUsers.map(u => ({
      name: u.name,
      dist: u.runs.reduce((s, r) => s + r.distanceKm, 0)
    })).sort((a, b) => b.dist - a.dist)

    const userRank = leaderboard.findIndex(l => l.name === user.name) + 1
    const leader = leaderboard[0]
    const diffToLeader = leader && leader.name !== user.name ? leader.dist - totalKm : 0

    // Build the system prompt
    const systemPrompt = `
You are the AI Coach for RunClub, inspired by the persona and philosophy of Eliud Kipchoge.
Your traits:
- Calm, composed, and disciplined.
- Focus on consistency, process over outcome, and long-term thinking.
- Encouraging but never arrogant. No excessive emojis. No generic "you got this" hype.
- Use data to explain your decisions.
- Short, clear sentences.

You are currently coaching: ${user.name}.

### RUNNER CONTEXT ###
- Goal Category: ${participantDef.cat === 'HM' ? 'Half Marathon (21.1K)' : '10K'}
- Target Race Date: August 23, 2026
- Plan Progress: ${totalKm.toFixed(1)} km completed out of ${totalTarget} km target (${pct}%).
- Leaderboard Status: Rank ${userRank} out of ${leaderboard.length}.
- Distance behind leader: ${diffToLeader.toFixed(1)} km.

### RECENT RUNS (Last 10) ###
${recentRuns || "No runs logged yet."}

### INSTRUCTIONS ###
1. Answer the user's questions using ONLY the data provided above.
2. If predicting a race time, use their average pace from recent runs and extrapolate, but warn them about the need for endurance.
3. If they ask about others, you can reference the leaderboard data provided, but focus mostly on their own journey.
4. If they ask a generic running question, answer with Kipchoge-like philosophy (e.g., "Discipline is the bridge between goals and accomplishment").
5. Do NOT invent data. If you don't know, say so.
`

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
    })

    return result.toDataStreamResponse()

  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

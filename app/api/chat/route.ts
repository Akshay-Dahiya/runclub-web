import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { PARTICIPANTS, grandTotal } from '../../../lib/planData'

export async function POST(req: Request) {
  try {
    const { messages, userId, apiKey: clientApiKey } = await req.json()
    const apiKey = process.env.OPENAI_API_KEY || clientApiKey

    if (!apiKey) {
      return new Response('Missing OpenAI API Key in server environment', { status: 500 })
    }

    if (!userId) {
      return new Response('Missing userId', { status: 400 })
    }

    const openai = createOpenAI({ apiKey })

    let participantDef = PARTICIPANTS.find(p => p.id === parseInt(userId)) || PARTICIPANTS.find(p => String(p.id) === String(userId))
    let userEmail = ""

    if (participantDef) {
      userEmail = participantDef.email || `placeholder_${participantDef.id}@runclub.local`
    } else {
      // Look up by database CUID first
      const dbUserByCuid = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (dbUserByCuid) {
        userEmail = dbUserByCuid.email
        participantDef = PARTICIPANTS.find(p => p.email === userEmail || `placeholder_${p.id}@runclub.local` === userEmail)
      }
    }

    if (!participantDef || !userEmail) {
      return new Response('Participant not found', { status: 404 })
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { runs: { orderBy: { date: 'desc' } } }
    })

    if (!user) {
      return new Response('User not found in database. Please seed the database first.', { status: 404 })
    }

    // Fetch all users for leaderboard context
    const allUsers = await prisma.user.findMany({
      include: { runs: true }
    })

    const totalTarget = grandTotal(participantDef)

    // Calculate context data
    const totalKm = user.runs.reduce((sum: number, run: any) => sum + run.distanceKm, 0)
    const pct = Math.round((totalKm / totalTarget) * 100)
    
    // Recent runs text
    const recentRuns = user.runs.slice(0, 10).map((r: any) => {
      const paceMin = Math.floor(r.paceSecPerKm / 60)
      const paceSec = String(r.paceSecPerKm % 60).padStart(2, '0')
      return `- ${new Date(r.date).toLocaleDateString()}: ${r.distanceKm}km at ${paceMin}:${paceSec}/km`
    }).join('\n')

    // Leaderboard logic
    const leaderboard = allUsers.map((u: any) => ({
      name: u.name,
      dist: u.runs.reduce((s: number, r: any) => s + r.distanceKm, 0)
    })).sort((a: any, b: any) => b.dist - a.dist)

    const userRank = leaderboard.findIndex((l: any) => l.name === user.name) + 1
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
- Goal Category: ${participantDef.cat.startsWith('HM') ? 'Half Marathon (21.1K)' : '10K'}
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

    const lastUserMessage = messages[messages.length - 1]?.content || ''

    const avgPaceSec = user.runs.length > 0 
      ? Math.round(user.runs.reduce((sum: number, r: any) => sum + r.paceSecPerKm, 0) / user.runs.length)
      : 360;
    const avgPaceMin = Math.floor(avgPaceSec / 60)
    const avgPaceSecStr = String(avgPaceSec % 60).padStart(2, '0')

    const createMockStream = (textResponse: string) => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          const words = textResponse.split(' ')
          for (let i = 0; i < words.length; i++) {
            const word = words[i]
            controller.enqueue(encoder.encode(word + (i === words.length - 1 ? '' : ' ')))
            await new Promise(resolve => setTimeout(resolve, 50))
          }
          controller.close()
        }
      })
      return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    const getKipchogeFallback = (message: string) => {
      const msg = message.toLowerCase()
      if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('greetings')) {
        return `Hello ${user.name}. I am glad to walk—or rather, run—this path with you. How is your mind and body feeling today? Let us discuss your preparation for the ${participantDef.cat.startsWith('HM') ? 'Half Marathon' : '10K'} on August 23.`
      }
      if (msg.includes('progress') || msg.includes('km') || msg.includes('distance') || msg.includes('how am i') || msg.includes('target') || msg.includes('run')) {
        return `You have completed ${totalKm.toFixed(1)} km out of your ${totalTarget} km target. That is ${pct}% of the journey. In running, consistency is the key. Every single kilometer you run builds the foundation of your success. Keep up the disciplined work, ${user.name}.`
      }
      if (msg.includes('leaderboard') || msg.includes('rank') || msg.includes('behind') || msg.includes('leader') || msg.includes('standing') || msg.includes('place')) {
        if (userRank === 1) {
          return `You are currently leading the club at Rank 1. It is a privilege to lead, but remember: the real competitor is the person you were yesterday. Keep training with humility.`
        }
        return `You are currently Rank ${userRank} on the leaderboard. You are ${diffToLeader.toFixed(1)} km behind the leader. Do not be discouraged by the gap; let it inspire you. A marathon is not won in the first mile. Focus on your own steps, day by day.`
      }
      if (msg.includes('predict') || msg.includes('time') || msg.includes('pace') || msg.includes('race') || msg.includes('finish')) {
        const targetDist = participantDef.cat.startsWith('HM') ? 21.1 : 10.0
        const totalSecs = targetDist * (avgPaceMin * 60 + parseInt(avgPaceSecStr))
        const estHours = Math.floor(totalSecs / 3600)
        const estMins = Math.floor((totalSecs % 3600) / 60)
        const estSecs = Math.round(totalSecs % 60)
        const timeStr = estHours > 0 
          ? `${estHours}h ${estMins}m ${estSecs}s`
          : `${estMins}m ${estSecs}s`

        return `Based on your recent average training pace of ${avgPaceMin}:${avgPaceSecStr}/km, your estimated finish time for the ${targetDist}K is approximately ${timeStr}. However, race day is not just about math; it is about heart, endurance, and mental strength. We must continue training our lungs and our minds to sustain this pace.`
      }
      const quotes = [
        `Only the disciplined ones in life are free. If you are undisciplined, you are a slave to your moods and your passions.`,
        `The best time to plant a tree was 20 years ago. The second best time is now. Keep showing up to run.`,
        `Become a person of character. Character is what keeps you going when the excitement of starting has worn off.`,
        `I don't run with my legs; I run with my heart and my mind. The mind is what drives the body forward.`,
        `Athletics is not so much about the legs. It's about the heart and mind. Believe in yourself and the training plan.`,
        `To win is not important. To participate and finish is what matters. Every step you take is a victory of discipline.`
      ]
      const randomIndex = Math.floor(Math.random() * quotes.length)
      return quotes[randomIndex]
    }

    const isMockKey = !apiKey || apiKey === 'mock' || apiKey === 'demo'

    if (isMockKey) {
      return createMockStream(getKipchogeFallback(lastUserMessage))
    }

    try {
      const openai = createOpenAI({ apiKey })
      const result = await streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages,
      })

      return result.toTextStreamResponse()
    } catch (apiError: any) {
      console.warn('OpenAI API call failed, falling back to local Kipchoge bot:', apiError)
      return createMockStream(getKipchogeFallback(lastUserMessage))
    }
  } catch (error: any) {
    console.error('Chat API Error:', error)
    const errorMsg = error?.message || 'Internal Server Error'
    return new Response(errorMsg, { status: 500 })
  }
}

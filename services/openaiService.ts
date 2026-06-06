import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateRunFeedback({ user, run }: { user: any; run: any }) {
  const prompt = `User: ${user.name || user.email}\nRun: ${run.distanceKm} km in ${run.durationSec} sec. Pace ${run.paceSecPerKm} sec/km. HR ${run.avgHeartRate}\nProvide a short coaching feedback with recovery and training recommendation.`
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300
  } as any)
  const text = resp.choices?.[0]?.message?.content || ''
  return text
}

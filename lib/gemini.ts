export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite'
export const FALLBACK_GEMINI_MODEL = 'gemini-3.1-flash-lite'
const DEFAULT_TIMEOUT_MS = 30_000

export function getGeminiApiKey(): string | undefined {
  if (typeof window !== 'undefined') return undefined
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
}

function scrubSecrets(message: string, apiKey?: string): string {
  let cleaned = message.replace(/key=[^&\s]+/gi, 'key=[REDACTED]')
  if (apiKey) {
    cleaned = cleaned.split(apiKey).join('[REDACTED]')
  }
  return cleaned
}

async function callGeminiModel({
  model,
  body,
  apiKey,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  model: string
  body: Record<string, unknown>
  apiKey: string
  timeoutMs?: number
}): Promise<{ text: string; model: string }> {
  const startedAt = Date.now()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (!res.ok) {
      const errorText = scrubSecrets(await res.text().catch(() => ''), apiKey)
      const err = new Error(`Gemini HTTP ${res.status} (${model}): ${errorText.slice(0, 300)}`)
      ;(err as any).status = res.status
      throw err
    }

    const data = await res.json()
    const parts = data?.candidates?.[0]?.content?.parts
    const text = Array.isArray(parts)
      ? parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).join('').trim()
      : ''

    if (!text) {
      const finishReason = data?.candidates?.[0]?.finishReason || 'unknown'
      throw new Error(`Gemini returned empty text (${model}, finishReason=${finishReason})`)
    }

    return { text, model }
  } catch (err: any) {
    const elapsedMs = Date.now() - startedAt
    const msg = scrubSecrets(err?.message || String(err), apiKey)
    console.error('[Gemini API error]', {
      model,
      status: err?.status ?? null,
      elapsedMs,
      error: msg,
    })
    throw new Error(msg)
  }
}

export async function generateGeminiText({
  prompt,
  systemInstruction,
  temperature = 0.4,
  maxOutputTokens = 800,
  responseMimeType,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  prompt: string
  systemInstruction?: string
  temperature?: number
  maxOutputTokens?: number
  responseMimeType?: 'application/json'
  timeoutMs?: number
}): Promise<string> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(responseMimeType ? { responseMimeType } : {}),
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const models = [DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODEL]
  let lastError: Error | null = null

  for (let i = 0; i < models.length; i++) {
    try {
      const result = await callGeminiModel({ model: models[i], body, apiKey, timeoutMs })
      return result.text
    } catch (err: any) {
      lastError = err
      console.warn(`[Gemini] Attempt ${i + 1}/${models.length} failed on ${models[i]}; ${i + 1 < models.length ? `retrying with ${models[i + 1]}` : 'no retries left'}`)
    }
  }

  throw lastError || new Error('Gemini generation failed after retry')
}

export type CoachFallbackContext = {
  runnerName: string
  goalLabel: string
  totalKm: number
  totalTarget: number
  progressPct: number
  runsCount: number
  latestRunSummary?: string
}

export function buildFallbackCoachMessage(ctx: CoachFallbackContext): string {
  const summaryLine = ctx.latestRunSummary
    ? `Your most recent logged session was ${ctx.latestRunSummary}.`
    : ''

  return [
    `Live AI generation hit a temporary hiccup, so here's guidance from your synced RunClub stats (${ctx.runnerName}):`,
    `• Goal: ${ctx.goalLabel} — ${ctx.totalKm.toFixed(1)} km logged of ${ctx.totalTarget} km (${ctx.progressPct}%) across ${ctx.runsCount} runs.`,
    summaryLine ? `• Latest run: ${summaryLine}` : null,
    `• Practical next step: Keep most weekly mileage at an easy conversational pace, limit week-over-week volume jumps to ~10–15%, and take a rest or recovery jog after hard efforts. Tap Retry in a moment for detailed feedback.`,
  ]
    .filter(Boolean)
    .join('\n')
}

export async function generateCoachChatReply({
  systemInstruction,
  messages,
  fallbackContext,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  systemInstruction: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  fallbackContext: CoachFallbackContext
  timeoutMs?: number
}): Promise<{ text: string; model: string; isFallback: boolean }> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY')
  }

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 800,
    },
  }

  const models = [DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODEL]

  for (let i = 0; i < models.length; i++) {
    try {
      const res = await callGeminiModel({ model: models[i], body, apiKey, timeoutMs })
      return { text: res.text, model: res.model, isFallback: false }
    } catch {
      console.warn(`[AI coach] Attempt ${i + 1}/${models.length} failed on ${models[i]}${i + 1 < models.length ? `, retrying once with ${models[i + 1]}` : ''}`)
    }
  }

  return {
    text: buildFallbackCoachMessage(fallbackContext),
    model: 'fallback',
    isFallback: true,
  }
}

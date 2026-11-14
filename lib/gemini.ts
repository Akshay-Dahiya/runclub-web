export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
}

export async function generateGeminiText({
  prompt,
  systemInstruction,
  temperature = 0.4,
  maxOutputTokens = 800,
  responseMimeType,
}: {
  prompt: string
  systemInstruction?: string
  temperature?: number
  maxOutputTokens?: number
  responseMimeType?: 'application/json'
}): Promise<string> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${apiKey}`

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(responseMimeType ? { responseMimeType } : {}),
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Gemini generateContent failed (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

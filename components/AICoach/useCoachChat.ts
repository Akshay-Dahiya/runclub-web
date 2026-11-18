"use client"

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'

export function extractMessageText(message: UIMessage | undefined | null): string {
  if (!message || !Array.isArray(message.parts)) return ''
  return message.parts.reduce((acc, part) => {
    if (part && part.type === 'text' && typeof part.text === 'string') {
      return acc + part.text
    }
    return acc
  }, '').trim()
}

function formatCoachError(error: Error | undefined, hasEmptyReply: boolean): string | null {
  if (error) {
    const msg = error.message || ''
    if (msg.includes('503')) {
      return 'AI Coach needs GEMINI_API_KEY configured on the server.'
    }
    if (msg.includes('401')) {
      return 'Open your own dashboard or connect Strava to chat with the coach.'
    }
    if (msg.includes('429')) {
      return 'You have sent several questions recently. Please wait a minute and retry.'
    }
    return 'The coach ran into a temporary issue. Tap Retry to try again.'
  }

  if (hasEmptyReply) {
    return 'No response came through from the coach. Tap Retry to try again.'
  }

  return null
}

/**
 * Shared state hook for AI Coach chat interfaces.
 * Persists conversation history per runner in sessionStorage and surfaces explicit loading/error/retry states.
 */
export function useCoachChat(userId: string) {
  const storageKey = `runclub_coach_chat_${userId}`
  const hydratedRef = useRef(false)
  const [lastPrompt, setLastPrompt] = useState('')
  const { messages, setMessages, sendMessage, regenerate, status, error, clearError } = useChat({
    id: `coach-${userId}`,
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (hydratedRef.current || typeof window === 'undefined') return
    hydratedRef.current = true
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0 && messages.length === 0) {
        setMessages(parsed)
        const lastUser = [...parsed].reverse().find((m: any) => m?.role === 'user')
        if (lastUser) {
          const txt = extractMessageText(lastUser)
          if (txt) setLastPrompt(txt)
        }
      }
    } catch {
      // Ignore corrupt sessionStorage state
    }
  }, [storageKey, setMessages, messages.length])

  useEffect(() => {
    if (!hydratedRef.current || typeof window === 'undefined') return
    try {
      const valid = messages.filter(
        (m) => m.role === 'user' || (m.role === 'assistant' && extractMessageText(m).length > 0),
      )
      if (valid.length > 0) {
        sessionStorage.setItem(storageKey, JSON.stringify(valid.slice(-30)))
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [messages, storageKey])

  const lastMessage = messages[messages.length - 1]
  const hasEmptyReply =
    !isLoading &&
    !error &&
    messages.length > 0 &&
    lastMessage?.role === 'assistant' &&
    extractMessageText(lastMessage) === ''

  const errorMessage = formatCoachError(error, hasEmptyReply)

  function sendPrompt(rawText: string): boolean {
    const text = rawText.trim()
    if (!text || isLoading) return false
    setLastPrompt(text)
    clearError()
    void sendMessage({ text }, { body: { userId } })
    return true
  }

  function retryLast() {
    if (isLoading) return
    clearError()
    if (lastMessage?.role === 'user' || hasEmptyReply) {
      void regenerate({ body: { userId } })
      return
    }
    if (lastPrompt) {
      void sendMessage({ text: lastPrompt }, { body: { userId } })
    }
  }

  function clearChat() {
    if (isLoading) return
    clearError()
    setMessages([])
    setLastPrompt('')
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(storageKey)
      } catch {
        // Ignore
      }
    }
  }

  return {
    messages,
    isLoading,
    errorMessage,
    canRetry: Boolean(errorMessage && (lastPrompt || lastMessage)),
    sendPrompt,
    retryLast,
    clearChat,
  }
}

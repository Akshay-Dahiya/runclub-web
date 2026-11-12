"use client"

import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import Link from 'next/link'
import ChatMessage from '../../../../components/AICoach/ChatMessage'
import SuggestedPrompts from '../../../../components/AICoach/SuggestedPrompts'

export default function CoachPageClient({ userId }: { userId: string }) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, status, error, clearError } = useChat()
  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function submitMessage() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    clearError()
    void sendMessage({ text })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitMessage()
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    submitMessage()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>AI COACH</h1>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Private training support</p>
        </div>
        <Link href={`/dashboard/${userId}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '4px', color: 'var(--text)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Back to dashboard
        </Link>
      </header>

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '32px 16px', overflow: 'hidden' }}>
        <section aria-label="AI coach conversation" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div role="log" aria-live="polite" aria-relevant="additions text" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {messages.length === 0 && (
              <div style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: 0.7, gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(252,76,2,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }} aria-hidden="true">
                  AI
                </div>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>Your coach is ready.</p>
                  <p style={{ margin: 0, fontSize: '14px', maxWidth: '400px', lineHeight: 1.6 }}>
                    Ask about your recent training, pacing, recovery, or next steps.
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => {
              if (message.role !== 'user' && message.role !== 'assistant') return null
              const content = message.parts.reduce((text, part) =>
                part.type === 'text' ? text + part.text : text,
              '')
              return content ? <ChatMessage key={message.id} role={message.role} content={content} /> : null
            })}

            {isLoading && <p role="status" style={{ padding: '16px', color: 'var(--muted)' }}>Your coach is thinking…</p>}
            {error && <p role="alert" style={{ padding: '16px', color: '#fb7185' }}>The coach could not respond. Please try again, or sign in again if your session expired.</p>}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
            <SuggestedPrompts onSelect={setInput} />
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
              <input
                aria-label="Ask your coach"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Ask your coach..."
                style={{ flex: 1, minWidth: 0, background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px 24px', borderRadius: '32px', color: 'var(--text)', outline: 'none', fontSize: '16px' }}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={isLoading || !input.trim()}
                style={{ background: 'var(--orange)', color: '#000', border: 'none', borderRadius: '50%', width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer', opacity: isLoading || !input.trim() ? 0.5 : 1 }}
              >
                Send
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

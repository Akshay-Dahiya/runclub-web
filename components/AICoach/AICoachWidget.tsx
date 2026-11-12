"use client"

import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import ChatMessage from './ChatMessage'
import SuggestedPrompts from './SuggestedPrompts'

export default function AICoachWidget({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
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
    <>
      <button
        type="button"
        aria-label="Open AI coach"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--orange)',
          color: '#000',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {isOpen && (
        <section
          role="region"
          aria-label="AI running coach"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: 'min(90vw, 400px)',
            height: 'min(600px, 80vh)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <header style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>AI Coach</h3>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.6, fontFamily: 'monospace' }}>PRIVATE TRAINING SUPPORT</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={`/dashboard/${userId}/coach`} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', textDecoration: 'none' }}>
                Expand
              </a>
              <button type="button" aria-label="Close AI coach" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', opacity: 0.7 }}>
                Close
              </button>
            </div>
          </header>

          <div role="log" aria-live="polite" aria-relevant="additions text" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', opacity: 0.6, marginTop: '40px', fontSize: '14px' }}>
                <p>Consistency creates fitness.</p>
                <p>What would you like to discuss about your training?</p>
              </div>
            )}
            {messages.map((message) => {
              if (message.role !== 'user' && message.role !== 'assistant') return null
              const content = message.parts.reduce((text, part) =>
                part.type === 'text' ? text + part.text : text,
              '')
              return content ? (
                <ChatMessage key={message.id} role={message.role} content={content} />
              ) : null
            })}
            {error && (
              <p role="alert" style={{ color: '#fb7185', fontSize: '13px' }}>
                The coach could not respond. Please try again, or sign in again if your session expired.
              </p>
            )}
            {isLoading && (
              <p role="status" style={{ opacity: 0.65, padding: '12px', fontSize: '13px' }}>
                Your coach is thinking…
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            <SuggestedPrompts onSelect={setInput} />
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                aria-label="Ask the AI coach"
                placeholder="Ask about your training..."
                style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '24px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={isLoading || !input.trim()}
                style={{ background: 'var(--orange)', color: '#000', border: 'none', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer', opacity: isLoading || !input.trim() ? 0.5 : 1 }}
              >
                Send
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  )
}

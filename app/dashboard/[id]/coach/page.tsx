"use client"
import React, { useState, useEffect, useRef } from 'react'

function useChatStub() {
  return {
    messages: [] as any[],
    input: '',
    handleInputChange: () => {},
    handleSubmit: (e: any) => { e.preventDefault(); },
    setInput: (text: string) => {},
    isLoading: false,
    error: null as any,
  };
}

import { useParams } from 'next/navigation'
import Link from 'next/link'
import ChatMessage from '../../../../components/AICoach/ChatMessage'
import SuggestedPrompts from '../../../../components/AICoach/SuggestedPrompts'

export default function CoachPage() {
  const params = useParams()
  const userId = params.id as string

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, setInput, isLoading, error } = useChatStub();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const promptClicked = (text: string) => {
    setInput(text)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>AI COACH</h1>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.6, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Powered by GPT-4o-mini</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* API key is handled server-side now */}
          <Link href={`/dashboard/${userId}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '4px', color: 'var(--text)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '32px 16px', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <>
              {messages.length === 0 && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: 0.6, gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(252,76,2,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🧠</div>
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Coach Kipchoge is ready.</p>
                    <p style={{ margin: 0, fontSize: '14px', maxWidth: '400px', lineHeight: 1.6 }}>"100% of me is nothing compared to 1% of the whole team." Ask about your pace, distance, or how to tackle your next run.</p>
                  </div>
                </div>
              )}
              {messages.map(m => (
                <ChatMessage key={m.id} role={m.role as 'user' | 'assistant'} content={m.content} />
              ))}
              {isLoading && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', opacity: 0.5, padding: '16px' }}>
                  <div style={{ width: '8px', height: '8px', background: 'var(--text)', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                  <div style={{ width: '8px', height: '8px', background: 'var(--text)', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }} />
                  <div style={{ width: '8px', height: '8px', background: 'var(--text)', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }} />
                </div>
              )}
              {error && (
                <div style={{ padding: '16px', background: 'rgba(255, 0, 0, 0.1)', color: 'red', borderRadius: '8px', margin: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                  Error: {error.message || 'Something went wrong.'}
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          </div>

          <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
            <SuggestedPrompts onSelect={promptClicked} />
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask your coach..."
                style={{
                  flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                  padding: '16px 24px', borderRadius: '32px', color: 'var(--text)',
                  outline: 'none', fontSize: '16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  background: 'var(--accent)', color: '#000', border: 'none',
                  borderRadius: '50%', width: '54px', height: '54px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || !input.trim()) ? 0.5 : 1,
                  fontSize: '20px'
                }}
              >
                ↑
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  )
}

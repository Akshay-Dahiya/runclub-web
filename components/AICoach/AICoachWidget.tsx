"use client"
import React, { useState, useEffect, useRef } from 'react'
// import { useChat } from 'ai/react' // Disabled due to export issue
// Simple stub for useChat when ai package is unavailable
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
import ChatMessage from './ChatMessage'
import SuggestedPrompts from './SuggestedPrompts'

export default function AICoachWidget({ userId }: { userId: string }) {
  const [apiKey, setApiKey] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [hasCheckedKey, setHasCheckedKey] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const key = localStorage.getItem('runclub_openai_key')
    if (key) setApiKey(key)
    setHasCheckedKey(true)
  }, [])

  const { messages, input, handleInputChange, handleSubmit, setInput, isLoading, error } = useChatStub();

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const key = fd.get('apiKey') as string
    localStorage.setItem('runclub_openai_key', key)
    setApiKey(key)
  }

  const promptClicked = (text: string) => {
    setInput(text)
  }

  // Prevent hydration mismatch by not rendering until key is checked
  if (!hasCheckedKey) return null

  return (
    <>
      {/* Floating Button */}
      <button
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
          zIndex: 999
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      {/* Chat Popover */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '90%',
          maxWidth: '400px',
          height: '600px',
          maxHeight: '80vh',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>AI Coach</h3>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.6, fontFamily: 'monospace' }}>POWERED BY GPT-4o-MINI</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={`/dashboard/${userId}/coach`} style={{
                background: 'none', border: '1px solid var(--border)', color: 'var(--text)',
                borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', textDecoration: 'none'
              }}>Expand</a>
              <button onClick={() => setIsOpen(false)} style={{
                background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', opacity: 0.6
              }}>✕</button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            {!apiKey ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--orange)' }}>Bring Your Own Key</h4>
                  <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>Please enter your OpenAI API key to use the AI Coach. It is saved locally in your browser.</p>
                </div>
                <form onSubmit={saveKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <input
                    type="password"
                    name="apiKey"
                    placeholder="sk-..."
                    required
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px', borderRadius: '4px', color: 'var(--text)', outline: 'none' }}
                  />
                  <button type="submit" style={{ background: 'var(--orange)', color: '#000', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                    Save Key
                  </button>
                </form>
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '40px', fontSize: '14px' }}>
                    <p>I am your coach. Consistency creates fitness.</p>
                    <p>What would you like to discuss about your training?</p>
                  </div>
                )}
                {messages.map(m => (
                  <ChatMessage key={m.id} role={m.role as 'user' | 'assistant'} content={m.content} />
                ))}
                {isLoading && (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', opacity: 0.5, padding: '12px' }}>
                    <div style={{ width: '6px', height: '6px', background: 'var(--text)', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                    <div style={{ width: '6px', height: '6px', background: 'var(--text)', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }} />
                    <div style={{ width: '6px', height: '6px', background: 'var(--text)', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Footer (Input) */}
          {apiKey && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
              <SuggestedPrompts onSelect={promptClicked} />
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about your training..."
                  style={{
                    flex: 1, background: 'var(--bg)', border: '1px solid var(--border)',
                    padding: '12px 16px', borderRadius: '24px', color: 'var(--text)',
                    outline: 'none', fontSize: '14px'
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  style={{
                    background: 'var(--orange)', color: '#000', border: 'none',
                    borderRadius: '50%', width: '42px', height: '42px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isLoading || !input.trim()) ? 0.5 : 1
                  }}
                >
                  ↑
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  )
}

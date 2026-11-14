"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import Link from 'next/link'
import { useChat } from '@ai-sdk/react'
import CoachDashboard from '../../../../components/Coach/CoachDashboard'
import ChatMessage from '../../../../components/AICoach/ChatMessage'
import SuggestedPrompts from '../../../../components/AICoach/SuggestedPrompts'

type CoachRun = {
  id: string
  date: string
  distanceKm: number
  durationSec: number
  paceSecPerKm: number
}

type CoachPageClientProps = {
  userId: string
  userName: string
  runs: CoachRun[]
}

export default function CoachPageClient({ userId, userName, runs }: CoachPageClientProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, status, error, clearError } = useChat()
  const isLoading = status === 'submitted' || status === 'streaming'

  const summary = useMemo(() => {
    const now = new Date()
    const dayOfWeek = (now.getDay() + 6) % 7 // Monday = 0, Sunday = 6
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)
    const recentRuns = runs.filter((run) => new Date(run.date) >= weekStart)
    const weeklyDistance = recentRuns.reduce((total, run) => total + run.distanceKm, 0)
    const longestRun = runs.reduce((longest, run) => Math.max(longest, run.distanceKm), 0)
    const lastRun = runs[0]

    return {
      weeklyDistance,
      weeklyRuns: recentRuns.length,
      longestRun,
      lastRunLabel: lastRun ? new Date(lastRun.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—',
    }
  }, [runs])

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
    <main className="coach-page">
      <header className="coach-page-header">
        <div>
          <p className="coach-eyebrow">RunClub · private coaching</p>
          <h1>Training dashboard</h1>
          <p className="coach-intro">Your weekly training, race goals, and coach in one place.</p>
        </div>
        <Link className="coach-back-link" href={`/dashboard/${userId}`}>
          <span aria-hidden="true">←</span> Runner profile
        </Link>
      </header>

      <section className="coach-overview" aria-label={`${userName}'s recent training overview`}>
        <div className="coach-overview-heading">
          <span className="coach-avatar" aria-hidden="true">{userName.trim().charAt(0).toUpperCase() || 'R'}</span>
          <div>
            <p className="coach-eyebrow">Your training snapshot</p>
            <h2>{userName}</h2>
          </div>
        </div>
        <div className="coach-stat-grid">
          <div className="coach-stat-card"><span>Last 7 days</span><strong>{summary.weeklyDistance.toFixed(1)} <small>km</small></strong></div>
          <div className="coach-stat-card"><span>Runs · 7 days</span><strong>{summary.weeklyRuns}</strong></div>
          <div className="coach-stat-card"><span>Longest logged run</span><strong>{summary.longestRun.toFixed(1)} <small>km</small></strong></div>
          <div className="coach-stat-card"><span>Last activity</span><strong className="coach-stat-date">{summary.lastRunLabel}</strong></div>
        </div>
      </section>

      <section className="coach-planner" aria-label="Training plan and race tools">
        <CoachDashboard userId={userId} userName={userName} runs={runs} />
      </section>

      <section className="coach-chat" aria-labelledby="coach-chat-title">
        <header className="coach-chat-header">
          <div>
            <p className="coach-eyebrow">Private training support</p>
            <h2 id="coach-chat-title">Ask your coach</h2>
            <p>Get guidance grounded in your RunClub training data.</p>
          </div>
        </header>

        <div className="coach-chat-log" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 && (
            <div className="coach-chat-empty">
              <span className="coach-chat-mark" aria-hidden="true">RC</span>
              <div>
                <p className="coach-chat-empty-title">Your coach is ready.</p>
                <p>Ask about pacing, recovery, your recent runs, or the next workout in your plan.</p>
              </div>
            </div>
          )}

          {messages.map((message) => {
            if (message.role !== 'user' && message.role !== 'assistant') return null
            const content = message.parts.reduce((text, part) => part.type === 'text' ? text + part.text : text, '')
            return content ? <ChatMessage key={message.id} role={message.role} content={content} /> : null
          })}

          {isLoading && <p role="status" className="coach-chat-status">Your coach is thinking…</p>}
          {error && <p role="alert" className="coach-chat-error">The coach could not respond. Please try again, or reconnect Strava if your session expired.</p>}
          <div ref={messagesEndRef} />
        </div>

        <div className="coach-chat-composer">
          <SuggestedPrompts onSelect={setInput} />
          <form onSubmit={handleSubmit} className="coach-chat-form">
            <input
              aria-label="Ask your coach"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask your coach..."
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      </section>

      <style jsx>{`
        .coach-page {
          --coach-accent: var(--orange, #fc4c02);
          width: min(100% - 32px, 1120px);
          margin: 0 auto;
          padding: 28px 0 72px;
          color: var(--text);
        }
        .coach-page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }
        .coach-eyebrow {
          margin: 0 0 6px;
          color: var(--coach-accent);
          font: 700 10px/1.4 monospace;
          letter-spacing: .16em;
          text-transform: uppercase;
        }
        .coach-page-header h1 {
          margin: 0;
          font-size: clamp(2rem, 7vw, 3rem);
          line-height: .98;
          letter-spacing: -.04em;
        }
        .coach-intro, .coach-chat-header > div > p:last-child {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
          margin: 10px 0 0;
        }
        .coach-back-link {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--text);
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }
        .coach-overview, .coach-chat {
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--surface);
          margin-bottom: 24px;
        }
        .coach-overview { padding: clamp(16px, 4vw, 24px); }
        .coach-overview-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .coach-avatar, .coach-chat-mark {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          color: var(--coach-accent);
          background: color-mix(in srgb, var(--coach-accent) 14%, transparent);
          font-weight: 800;
        }
        .coach-overview-heading h2, .coach-chat-header h2 { margin: 0; font-size: 18px; letter-spacing: -.02em; }
        .coach-overview-heading .coach-eyebrow { margin-bottom: 3px; }
        .coach-stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .coach-stat-card {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 8px;
          padding: 13px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg);
        }
        .coach-stat-card span { color: var(--muted); font-size: 10px; line-height: 1.4; }
        .coach-stat-card strong { font-size: clamp(18px, 4vw, 24px); line-height: 1; letter-spacing: -.03em; }
        .coach-stat-card small { color: var(--muted); font-size: 11px; }
        .coach-stat-date { font-size: clamp(15px, 3.5vw, 20px) !important; }
        .coach-planner { margin-bottom: 26px; }
        .coach-chat { overflow: hidden; }
        .coach-chat-header { padding: 18px 20px; border-bottom: 1px solid var(--border); }
        .coach-chat-header > div > p:last-child { margin-top: 6px; }
        .coach-chat-log { height: 360px; overflow-y: auto; padding: 16px; }
        .coach-chat-empty { min-height: 100%; display: flex; align-items: center; justify-content: center; gap: 14px; color: var(--muted); }
        .coach-chat-empty p { margin: 0; font-size: 13px; line-height: 1.6; }
        .coach-chat-empty-title { color: var(--text); font-size: 16px !important; font-weight: 700; margin-bottom: 3px !important; }
        .coach-chat-mark { width: 48px; height: 48px; }
        .coach-chat-status, .coach-chat-error { padding: 12px; font-size: 13px; }
        .coach-chat-status { color: var(--muted); }
        .coach-chat-error { color: #fb7185; }
        .coach-chat-composer { padding: 16px; border-top: 1px solid var(--border); background: var(--bg); }
        .coach-chat-form { display: flex; gap: 8px; }
        .coach-chat-form input {
          flex: 1;
          min-width: 0;
          min-height: 48px;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0 16px;
          background: var(--surface);
          color: var(--text);
          font-size: 16px;
        }
        .coach-chat-form button {
          min-width: 64px;
          border: 0;
          border-radius: 999px;
          padding: 0 16px;
          background: var(--coach-accent);
          color: #111;
          font: 700 12px monospace;
        }
        .coach-chat-form button:disabled { cursor: not-allowed; opacity: .5; }
        @media (max-width: 640px) {
          .coach-page { width: min(100% - 24px, 1120px); padding-top: 18px; }
          .coach-page-header { align-items: flex-start; flex-direction: column-reverse; gap: 16px; }
          .coach-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .coach-chat-log { height: 320px; }
          .coach-chat-header { padding: 16px; }
          .coach-chat-composer { padding: 12px; }
        }
      `}</style>
    </main>
  )
}

"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PARTICIPANTS } from '../../lib/planData'

export default function LoginPage() {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedId) { setError('Please select your name.'); return }
    if (password !== 'runclub2026') { setError('Wrong password. Hint: it\'s the club password!'); return }
    setLoading(true)
    router.push(`/dashboard/${selectedId}`)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: '48px', textDecoration: 'none' }}>
          <img src="/logo.png?v=2" alt="Joyville Road Runners Logo" style={{ height: '32px' }} />
          ← JOYVILLE ROAD RUNNERS
        </a>

        {/* Heading */}
        <p style={{ fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--orange)', margin: '0 0 12px 0' }}>
          ▶ Runner Login
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.02em', margin: '0 0 12px 0' }}>
          YOUR<br /><span style={{ color: 'var(--orange)' }}>DASHBOARD.</span>
        </h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '40px', lineHeight: 1.6 }}>
          Select your name and enter the club password to open your personal training stats.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Name Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}>
              Your Name
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              required
              style={{
                background: 'var(--surface)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: '6px',
                padding: '14px 16px', fontSize: '1rem', cursor: 'pointer',
                outline: 'none', width: '100%'
              }}
            >
              <option value="">Select your name...</option>
              {PARTICIPANTS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.cat === 'HM' ? 'Half Marathon' : '10K'}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}>
              Club Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              style={{
                background: 'var(--surface)', color: 'var(--text)',
                border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`, borderRadius: '6px',
                padding: '14px 16px', fontSize: '1rem', outline: 'none', width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '4px', padding: '10px 14px', color: '#ef4444', fontFamily: 'monospace', fontSize: '12px' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--orange)', color: '#000', border: 'none', borderRadius: '6px',
              padding: '16px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.15em',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s', marginTop: '8px'
            }}
          >
            {loading ? 'Opening...' : 'Open My Dashboard →'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '12px', opacity: 0.4, textAlign: 'center' }}>
          Only Joyville Road Runners members can access dashboards.
        </p>
      </div>
    </div>
  )
}

"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { createClient } from '../../lib/supabase/client'
import { getSupabaseConfig } from '../../lib/supabase/config'

type RunnerAuthFormProps = {
  mode: 'login' | 'signup'
}

  function getSafeNextPath() {
    const next = new URLSearchParams(window.location.search).get('next')
    return next && next.startsWith('/') && !next.startsWith('//') && !next.includes(String.fromCharCode(92))
      ? next
      : null
  }

function getErrorMessage(error: { code?: string; status?: number } | null, mode: RunnerAuthFormProps['mode']) {
  if (error?.status === 429 || error?.code === 'over_request_rate_limit') {
    return 'Too many attempts. Please wait a little and try again.'
  }
  if (mode === 'login' && error?.code === 'email_not_confirmed') {
    return 'Confirm your email using the link we sent before signing in.'
  }
  if (mode === 'login' && error?.code === 'invalid_credentials') {
    return 'Invalid email or password.'
  }
  if (mode === 'signup' && error?.code === 'weak_password') {
    return 'Choose a stronger password with at least 8 characters.'
  }
  return mode === 'login'
    ? 'We could not sign you in. Check your details and try again.'
    : 'We could not create your account. Check your details and try again.'
}

export default function RunnerAuthForm({ mode }: RunnerAuthFormProps) {
  const router = useRouter()
  const isSignup = mode === 'signup'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [runningGoal, setRunningGoal] = useState('10.5K Run')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const authConfigured = Boolean(getSupabaseConfig())

  async function redirectToRunner() {
    const response = await fetch('/api/auth/me', { cache: 'no-store' })
    if (!response.ok) {
      setError('Your email is confirmed, but your runner profile could not be loaded. Please contact the club admin.')
      return
    }
    const { runner } = await response.json()
    router.replace(getSafeNextPath() || `/dashboard/${runner.id}`)
    router.refresh()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!authConfigured) return
    setMessage('')
    setSubmitting(true)

    try {
      const supabase = createClient()
      const normalizedEmail = email.trim().toLowerCase()

      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo:
              process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
              `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName.trim(),
              running_goal: runningGoal,
            },
          },
        })

        if (signUpError) {
          setError(getErrorMessage(signUpError, mode))
          return
        }

        if (data.session) {
          await redirectToRunner()
          return
        }

        setMessage('Check your inbox for a verification link. Your runner account is ready after you confirm your email.')
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (signInError) {
        setError(getErrorMessage(signInError, mode))
        return
      }

      await redirectToRunner()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section style={{ width: 'min(100%, 480px)', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ color: 'var(--orange)', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 10px' }}>
          Runner account
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.25rem)', lineHeight: 1, letterSpacing: '-0.04em', margin: 0, textTransform: 'uppercase' }}>
          {isSignup ? 'Join RunClub' : 'Welcome back'}
        </h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: '14px 0 0' }}>
          {isSignup
            ? 'Create a secure account to manage your runs and private coaching plan.'
            : 'Sign in to manage your training, runs, and connected devices.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '28px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface)' }}>
        {isSignup && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
            Runner name
            <input
              autoComplete="name"
              required
              maxLength={80}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              style={inputStyle}
            />
          </label>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
          Password
          <input
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={inputStyle}
          />
        </label>

        {isSignup && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
            Training goal
            <select value={runningGoal} onChange={(event) => setRunningGoal(event.target.value)} style={inputStyle}>
              <option value="10.5K Run">10K</option>
              <option value="21.1K Half Marathon">Half marathon</option>
            </select>
          </label>
        )}

        {error && <p role="alert" style={{ color: '#fb7185', margin: 0, lineHeight: 1.5 }}>{error}</p>}
        {message && <p role="status" style={{ color: '#4ade80', margin: 0, lineHeight: 1.5 }}>{message}</p>}
        {!authConfigured && (
          <p role="status" style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
            Runner sign-in is unavailable in this preview because the existing Supabase configuration is not loaded here.
          </p>
        )}

        <button type="submit" disabled={submitting || !authConfigured} style={{ minHeight: '48px', border: 0, borderRadius: '6px', background: 'var(--orange)', color: '#111', fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: submitting || !authConfigured ? 'not-allowed' : 'pointer', opacity: submitting || !authConfigured ? 0.65 : 1 }}>
          {submitting ? 'Please wait…' : !authConfigured ? 'Sign-in unavailable in preview' : isSignup ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', marginTop: '22px' }}>
        {isSignup ? 'Already have an account?' : 'New to RunClub?'}{' '}
        <Link href={isSignup ? '/login' : '/signup'} style={{ color: 'var(--orange)', fontWeight: 700 }}>
          {isSignup ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
      {isSignup && (
        <p style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: 1.6, textAlign: 'center' }}>
          Use the email already on your RunClub profile to keep its history linked. If your profile uses a club placeholder email, ask an admin to verify and update it before creating your account.
        </p>
      )}
    </section>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '46px',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  background: 'var(--bg)',
  color: 'var(--text)',
  font: 'inherit',
}

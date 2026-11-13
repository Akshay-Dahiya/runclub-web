"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

const errorMessages: Record<string, string> = {
  strava_config: 'Strava connection is not configured for this preview. Please try again from the RunClub deployment.',
  strava_state: 'That secure Strava link expired. Start the connection again.',
  strava_denied: 'Strava access was cancelled. You can connect again whenever you are ready.',
  strava_token_failed: 'Strava could not authorize this connection. Please try again.',
  strava_account_in_use: 'This Strava athlete is already linked to another RunClub profile.',
  strava_profile_already_linked: 'This RunClub profile is already connected to a different Strava athlete.',
  strava_failed: 'We could not finish creating your profile. Please try connecting again.',
}

export default function RunnerAuthForm() {
  const [error, setError] = useState('')

  useEffect(() => {
    const errorCode = new URLSearchParams(window.location.search).get('error')
    if (errorCode) setError(errorMessages[errorCode] || 'We could not finish the Strava connection. Please try again.')
  }, [])

  return (
    <section style={{ width: 'min(100%, 480px)', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ color: 'var(--orange)', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 10px' }}>
          Runner profile
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.25rem)', lineHeight: 1, letterSpacing: '-0.04em', margin: 0, textTransform: 'uppercase' }}>
          Continue with Strava
        </h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: '14px 0 0' }}>
          Connect your Strava athlete account and RunClub will create or reopen your runner profile automatically.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: 'clamp(20px, 6vw, 28px)', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface)' }}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <strong style={{ fontSize: '15px' }}>One connection. Your profile is ready.</strong>
          <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
            Your Strava athlete details create your RunClub profile, and recent runs sync after you approve access. No separate RunClub email, password, or sign-up form is needed.
          </p>
        </div>

        {error && <p role="alert" style={{ color: '#fb7185', margin: 0, lineHeight: 1.5 }}>{error}</p>}

        <a
          href="/api/strava"
          style={{ minHeight: '50px', borderRadius: '8px', background: 'var(--orange)', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 18px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', textAlign: 'center' }}
        >
          Connect with Strava
        </a>

        <p style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: 1.6, margin: 0 }}>
          RunClub receives permission to read your athlete profile and running activities. You can disconnect Strava from your profile at any time.
        </p>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: 1.6, textAlign: 'center', marginTop: '20px' }}>
        Already joined? Connect the same Strava athlete and your existing RunClub profile will reopen.
        {' '}<Link href="/" style={{ color: 'var(--orange)', fontWeight: 700 }}>Back to RunClub</Link>
      </p>
    </section>
  )
}

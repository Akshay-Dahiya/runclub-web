import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Join RunClub with Strava',
  description: 'Connect Strava to automatically create your RunClub runner profile.',
}

export default function SignupPage() {
  return (
    <main style={{ minHeight: '100vh', padding: 'clamp(24px, 6vw, 72px) 20px', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto 56px' }}>
        <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          RunClub
        </Link>
      </div>
      <section style={{ width: 'min(100%, 480px)', margin: '0 auto' }}>
        <p style={{ color: 'var(--orange)', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 10px' }}>
          Runner profile
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.25rem)', lineHeight: 1, letterSpacing: '-0.04em', margin: 0, textTransform: 'uppercase' }}>
          Create your profile
        </h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: '14px 0 24px' }}>
          Connect your Strava athlete account to create or reopen your RunClub profile. No separate RunClub password is needed.
        </p>
        <form action="/api/auth/start-signup" method="post">
          <button type="submit" style={{ width: '100%', minHeight: '50px', border: 0, borderRadius: '8px', background: 'var(--orange)', color: '#111', padding: '12px 18px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Continue with Strava
          </button>
        </form>
      </section>
    </main>
  )
}

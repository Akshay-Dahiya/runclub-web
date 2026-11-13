import type { Metadata } from 'next'
import Link from 'next/link'
import RunnerAuthForm from '../../components/Auth/RunnerAuthForm'

export const metadata: Metadata = {
  title: 'Connect with Strava | RunClub',
  description: 'Sign in or create your runner profile with your Strava athlete account.',
}

export default function LoginPage() {
  return (
    <main style={{ minHeight: '100vh', padding: 'clamp(24px, 6vw, 72px) 20px', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto 56px' }}>
        <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          RunClub
        </Link>
      </div>
      <RunnerAuthForm />
    </main>
  )
}

"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RunnerSignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.replace('/login')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      style={{ border: '1px solid var(--border)', borderRadius: '999px', padding: '9px 14px', background: 'transparent', color: 'var(--text)', font: '600 12px monospace', cursor: busy ? 'wait' : 'pointer' }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}

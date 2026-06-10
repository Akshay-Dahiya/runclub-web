"use client"
import React, { useState } from 'react'

const s = {
  page: { minHeight: '100vh', background: '#0a0a0a', color: '#e8e8e8', fontFamily: "'Space Grotesk', system-ui, sans-serif", padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badge: { background: '#FC4C02', color: '#000', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.15em' },
  modalBox: { background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '28px', width: '90%', maxWidth: '360px' },
  label: { fontFamily: 'monospace', fontSize: '10px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '4px', display: 'block' },
  formGroup: { marginBottom: '16px' },
  input: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#e8e8e8', padding: '8px 12px', fontFamily: 'monospace', fontSize: '13px', width: '100%', boxSizing: 'border-box' as const },
  btn: { background: '#FC4C02', color: '#000', border: 'none', borderRadius: '4px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em', width: '100%' },
}

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ password }) 
      })
      const data = await res.json()
      if (res.ok && data.ok) { 
        window.location.href = '/admin'
      } else {
        setError(data.error || 'Incorrect password')
      }
    } catch { 
      setError('Error connecting to server') 
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.modalBox}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-block', ...s.badge }}>ADMIN</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '16px', marginBottom: '4px' }}>RunClub Admin</h1>
          <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>Restricted access</p>
        </div>
        <form onSubmit={submit}>
          <div style={s.formGroup}>
            <label style={s.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={s.input} autoFocus />
          </div>
          {error && <div style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Checking...' : 'Enter Panel →'}
          </button>
        </form>
      </div>
    </div>
  )
}

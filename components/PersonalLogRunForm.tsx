"use client"

import React, { useRef, useState } from 'react'
import { logRun } from '../app/actions'

export default function PersonalLogRunForm({ email }: { email: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsg('Saving run...')
    const formData = new FormData(e.currentTarget)
    formData.append('email', email)
    
    try {
      await logRun(formData)
      setMsg('Run saved successfully!')
      formRef.current?.reset()
      setTimeout(() => setMsg(''), 3000)
    } catch (err: any) {
      setMsg('Error saving run: ' + err.message)
    }
  }

  return (
    <div className="log-form" style={{ marginTop: '24px' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', fontFamily: "'Bebas Neue', sans-serif" }}>Log a New Run</h3>
      <form ref={formRef} onSubmit={handleSubmit} className="form-row">
        <div className="form-group" style={{ maxWidth: '140px' }}>
          <label className="form-label">Distance (KM)</label>
          <input className="form-input" type="number" name="distance" placeholder="5.0" step="0.5" min="0.5" required />
        </div>
        <div className="form-group" style={{ maxWidth: '160px' }}>
          <label className="form-label">Date</label>
          <input className="form-input" type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="form-group" style={{ maxWidth: '120px' }}>
          <label className="form-label">Pace (min/km)</label>
          <input className="form-input" type="text" name="pace" placeholder="5:30" required />
        </div>
        <div className="form-group" style={{ flex: 0, minWidth: 'auto' }}>
          <label className="form-label">&nbsp;</label>
          <button type="submit" className="btn-primary">Add Run →</button>
        </div>
      </form>
      <div id="log-msg" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.72rem', color: 'var(--green)', letterSpacing: '2px', minHeight: '22px', marginTop: '8px' }}>
        {msg}
      </div>
    </div>
  )
}

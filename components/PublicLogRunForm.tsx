"use client"

import React, { useRef, useState } from 'react'
import { logRun } from '../app/actions'

export default function PublicLogRunForm({ runners }: { runners: {name: string, email: string}[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMsg('Saving run...')
    const formData = new FormData(e.currentTarget)
    
    try {
      await logRun(formData)
      setMsg('Run saved successfully!')
      formRef.current?.reset()
      setTimeout(() => setMsg(''), 3000)
    } catch (err: any) {
      setMsg('Error saving run: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="log-form reveal visible" style={{ marginTop: '24px', background: 'var(--surface)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', fontFamily: "'Bebas Neue', sans-serif" }}>Log A Run</h3>
      <p style={{ opacity: 0.8, marginBottom: '24px', fontSize: '0.9rem' }}>Select your name and add your distance. Or sync automatically.</p>
      
      {/* INTEGRATION BUTTONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        <button type="button" className="integration-btn strava" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ marginTop: '-2px' }}><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
          Strava (Coming Soon)
        </button>
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.6 }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '3px', textTransform: 'uppercase' }}>Or Log Manually</div>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Runner</label>
            <select className="form-input" name="email" required defaultValue="">
              <option value="" disabled>Select your name...</option>
              {runners.map(r => (
                <option key={r.email} value={r.email}>{r.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Distance (KM)</label>
            <input className="form-input" type="number" name="distance" placeholder="5.00" step="0.01" min="0.01" required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date</label>
            <input className="form-input" type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginTop: '8px', marginBottom: '-8px' }}>
          Enter Pace OR Duration (optional)
        </div>

        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Pace (MM:SS)</label>
            <input className="form-input" type="text" name="pace" placeholder="5:30" />
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Duration (HH:MM)</label>
            <input className="form-input" type="text" name="duration" placeholder="45:00" />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
          {loading ? 'Logging...' : 'Add Run →'}
        </button>
      </form>
      
      <div id="log-msg" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.8rem', color: 'var(--green)', letterSpacing: '1px', minHeight: '22px', marginTop: '12px', textAlign: 'center' }}>
        {msg}
      </div>
    </div>
  )
}

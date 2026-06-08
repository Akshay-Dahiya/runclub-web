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
        <button type="button" className="integration-btn strava">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ marginTop: '-2px' }}><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
          Sync Strava
        </button>
        <button type="button" className="integration-btn apple">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ marginTop: '-2px' }}><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.48-.74 2.14 0 3.76.98 4.7 2.45-3.8 2.37-2.92 7.02 1.05 8.52-.77 2.05-1.99 4.14-3.3 5.46M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25"/></svg>
          Apple Health
        </button>
        <button type="button" className="integration-btn garmin">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ marginTop: '-2px' }}><path d="M12 0L2.1 5.7v12.6L12 24l9.9-5.7V5.7L12 0zm0 1.9l8.3 4.8v9.6l-8.3 4.8-8.3-4.8V6.7L12 1.9zm0 5.4c-2.6 0-4.7 2.1-4.7 4.7 0 2.6 2.1 4.7 4.7 4.7s4.7-2.1 4.7-4.7c0-2.6-2.1-4.7-4.7-4.7zm0 1.9c1.6 0 2.8 1.2 2.8 2.8S13.6 14.8 12 14.8 9.2 13.6 9.2 12 10.4 9.2 12 9.2z"/></svg>
          Garmin Connect
        </button>
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.6 }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '3px', textTransform: 'uppercase' }}>Or Log Manually</div>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
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
            <input className="form-input" type="number" name="distance" placeholder="5.0" step="0.5" min="0.5" required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date</label>
            <input className="form-input" type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Pace (min/km)</label>
            <input className="form-input" type="text" name="pace" placeholder="5:30" required />
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

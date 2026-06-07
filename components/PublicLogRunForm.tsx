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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        <button type="button" style={{ background: '#fc4c02', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Sync Strava</button>
        <button type="button" style={{ background: '#000000', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Apple Health</button>
        <button type="button" style={{ background: '#007cc3', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Garmin Connect</button>
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '24px', opacity: 0.5, fontSize: '0.9rem', fontWeight: 'bold' }}>— OR LOG MANUALLY —</div>

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

"use client"

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password
    })

    if (res?.error) {
      setError('Invalid credentials. Did you use runclub2026?')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <>
      <Navbar />
      <div className="section" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ maxWidth: '400px', width: '100%', background: 'var(--surface)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '8px' }}>Runner Login</h2>
          <p className="section-sub" style={{ marginBottom: '32px' }}>Access your personalized training plan and log your runs.</p>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <input 
                className="form-input" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="runner@runclub.local" 
                required 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Password</label>
              <input 
                className="form-input" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
            </div>
            
            {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</div>}
            
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px', width: '100%' }}>
              {loading ? 'Logging in...' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}

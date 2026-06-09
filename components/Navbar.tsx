"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' })
  useEffect(() => {
    // Tuffman: August 23, 2026
    const targetDate = new Date('2026-08-23T05:00:00').getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const diff = targetDate - now

      if (diff <= 0) {
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00' })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({
        d: String(days).padStart(2, '0'),
        h: String(hours).padStart(2, '0'),
        m: String(minutes).padStart(2, '0'),
        s: String(seconds).padStart(2, '0')
      })
    }

    updateCountdown()
    const timerId = setInterval(updateCountdown, 1000)
    return () => clearInterval(timerId)
  }, [])

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
      {/* COUNTDOWN BANNER */}
      <div className="countdown-strip" style={{ padding: '8px 48px', borderBottom: 'none', background: 'var(--surface)', color: 'var(--text)', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--accent)', background: 'var(--accent)', color: '#000', fontSize: '0.75rem', fontWeight: 700 }}>
            Tuffman · Aug 23
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div className="cd-unit"><span className="cd-num" style={{ fontSize: '1.8rem' }}>{timeLeft.d}</span><span className="cd-lbl">Days</span></div>
          <div className="cd-sep" style={{ fontSize: '1.4rem', marginBottom: '4px' }}>:</div>
          <div className="cd-unit"><span className="cd-num" style={{ fontSize: '1.8rem' }}>{timeLeft.h}</span><span className="cd-lbl">Hours</span></div>
          <div className="cd-sep" style={{ fontSize: '1.4rem', marginBottom: '4px' }}>:</div>
          <div className="cd-unit"><span className="cd-num" style={{ fontSize: '1.8rem' }}>{timeLeft.m}</span><span className="cd-lbl">Mins</span></div>
          <div className="cd-sep" style={{ fontSize: '1.4rem', marginBottom: '4px' }}>:</div>
          <div className="cd-unit"><span className="cd-num" style={{ fontSize: '1.8rem' }}>{timeLeft.s}</span><span className="cd-lbl">Secs</span></div>
        </div>
      </div>
      <nav style={{ position: 'relative' }}>
      <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Image src="/logo.png?v=3" alt="Joyville Road Runners Logo" width={48} height={48} style={{ height: '48px', width: 'auto' }} />
        JOYVILLE ROAD RUNNERS
      </Link>
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ zIndex: 101, position: 'relative' }}
      >
        {isOpen ? '✕' : '☰'}
      </button>
      <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
        <li><Link href="/#members" onClick={() => setIsOpen(false)}>Members</Link></li>
        <li><Link href="/#plans" onClick={() => setIsOpen(false)}>Training Plans</Link></li>
        <li><Link href="/#leaderboard" onClick={() => setIsOpen(false)}>Leaderboard</Link></li>
        <li><Link href="/#dashboard" onClick={() => setIsOpen(false)} style={{ color: 'var(--accent)', fontWeight: 'bold' }}>My Dashboard</Link></li>
        <li>
          <Link href="/login" onClick={() => setIsOpen(false)} style={{
            background: 'var(--accent)', color: '#000', padding: '8px 18px',
            borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem'
          }}>
            Login
          </Link>
        </li>
      </ul>
      </nav>
    </div>
  )
}

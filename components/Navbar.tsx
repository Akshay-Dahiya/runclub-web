"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' })

  useEffect(() => {
    // August 23, 2026 at 05:00:00 (race morning)
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
      <div className="countdown-strip" style={{ padding: '8px 48px', borderBottom: 'none', background: 'var(--accent)', color: '#000' }}>
        <span className="countdown-label" style={{ color: 'rgba(0,0,0,0.7)', fontWeight: 'bold' }}>⏱ Race Day: Aug 23, 2026</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div className="cd-unit"><span className="cd-num" style={{ fontSize: '1.8rem', color: '#000' }}>{timeLeft.d}</span><span className="cd-lbl" style={{ color: 'rgba(0,0,0,0.7)' }}>Days</span></div>
          <div className="cd-sep" style={{ fontSize: '1.4rem', color: 'rgba(0,0,0,0.4)', marginBottom: '4px' }}>:</div>
          <div className="cd-unit"><span className="cd-num" style={{ fontSize: '1.8rem', color: '#000' }}>{timeLeft.h}</span><span className="cd-lbl" style={{ color: 'rgba(0,0,0,0.7)' }}>Hours</span></div>
          <div className="cd-sep" style={{ fontSize: '1.4rem', color: 'rgba(0,0,0,0.4)', marginBottom: '4px' }}>:</div>
          <div className="cd-unit"><span className="cd-num" style={{ fontSize: '1.8rem', color: '#000' }}>{timeLeft.m}</span><span className="cd-lbl" style={{ color: 'rgba(0,0,0,0.7)' }}>Mins</span></div>
          <div className="cd-sep" style={{ fontSize: '1.4rem', color: 'rgba(0,0,0,0.4)', marginBottom: '4px' }}>:</div>
          <div className="cd-unit"><span className="cd-num" style={{ fontSize: '1.8rem', color: '#000' }}>{timeLeft.s}</span><span className="cd-lbl" style={{ color: 'rgba(0,0,0,0.7)' }}>Secs</span></div>
        </div>
      </div>
      <nav style={{ position: 'relative' }}>
      <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/logo.png?v=2" alt="Joyville Road Runners Logo" style={{ height: '32px' }} />
        JOYVILLE ROAD RUNNERS
      </Link>
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
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

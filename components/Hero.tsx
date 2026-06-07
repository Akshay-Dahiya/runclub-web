"use client"

import React, { useState, useEffect } from 'react'

export default function Hero() {
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

    // Run once immediately
    updateCountdown()
    
    // Update every second
    const timerId = setInterval(updateCountdown, 1000)
    return () => clearInterval(timerId)
  }, [])

  return (
    <>
      <div className="hero">
        <div className="hero-bg"></div>
        <div className="hero-lines">
          <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="900" cy="350" rx="560" ry="270" fill="none" stroke="white" strokeWidth="1"/>
            <ellipse cx="900" cy="350" rx="460" ry="200" fill="none" stroke="white" strokeWidth="1"/>
            <ellipse cx="900" cy="350" rx="360" ry="130" fill="none" stroke="white" strokeWidth="1"/>
            <line x1="0" y1="350" x2="1200" y2="350" stroke="white" strokeWidth=".5"/>
          </svg>
        </div>
        <div className="hero-eyebrow">▶ Joyville Road Runners · Race Day Aug 23, 2026</div>
        <h1 className="hero-title">
          <span style={{ color: 'var(--text)' }}>RUN</span><br/>
          <span className="outline">FASTER</span><br/>
          <span style={{ color: 'var(--text)' }}>TOGETHER</span>
        </h1>
        <p className="hero-sub">
          12 runners. 5 on the Half Marathon. 7 on the 10K. 10 weeks. One finish line. 
          Track every km, hold each other accountable, and cross it on August 23rd.
        </p>
        <div className="hero-ctas">
          <a href="/login" className="btn-primary">Go to Dashboard →</a>
          <a href="#members" className="btn-ghost">View The Crew</a>
        </div>
      </div>

      {/* COUNTDOWN */}
      <div className="countdown-strip">
        <span className="countdown-label">⏱ Race Day Countdown</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div className="cd-unit"><span className="cd-num" id="cd-d">{timeLeft.d}</span><span className="cd-lbl">Days</span></div>
          <div className="cd-sep">:</div>
          <div className="cd-unit"><span className="cd-num" id="cd-h">{timeLeft.h}</span><span className="cd-lbl">Hours</span></div>
          <div className="cd-sep">:</div>
          <div className="cd-unit"><span className="cd-num" id="cd-m">{timeLeft.m}</span><span className="cd-lbl">Mins</span></div>
          <div className="cd-sep">:</div>
          <div className="cd-unit"><span className="cd-num" id="cd-s">{timeLeft.s}</span><span className="cd-lbl">Secs</span></div>
        </div>
      </div>
    </>
  )
}

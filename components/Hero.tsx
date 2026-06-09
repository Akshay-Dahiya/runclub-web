"use client"

import React, { useState, useEffect } from 'react'

export default function Hero() {
  const [targetName, setTargetName] = useState<'joyville' | 'tuffman'>('joyville')
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Both targets happen to be Aug 23, 2026 for now, or whenever
    const targetDate = new Date('2026-08-23T06:00:00+05:30').getTime()

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
  }, [targetName])

  return (
    <div className="hero-section">
      {/* BACKGROUND ELEMENTS */}
      <div className="hero-bg-base"></div>
      <div className="hero-track-container">
        <svg className="hero-track" viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="600" cy="600" rx="560" ry="270" fill="none" stroke="#3b82f6" strokeWidth="1"/>
          <ellipse cx="600" cy="600" rx="460" ry="200" fill="none" stroke="#3b82f6" strokeWidth="1"/>
          <ellipse cx="600" cy="600" rx="360" ry="130" fill="none" stroke="#3b82f6" strokeWidth="1"/>
          <ellipse cx="600" cy="600" rx="260" ry="60" fill="none" stroke="#3b82f6" strokeWidth="1"/>
        </svg>
      </div>
      <div className="hero-bg-overlay"></div>

      {/* CONTENT */}
      <div className="hero-content">
        <div className="hero-eyebrow">// JOYVILLE ROAD RUNNERS · DELHI 2026</div>
        
        <h1 className="hero-headline">
          <div className="hl-line1">EVERY MILE</div>
          <div className="hl-line2">COUNTS.</div>
        </h1>
        
        <div className="hero-subheadline-block">
          <div className="sub-label">15 runners. One city. Race day Aug 23, 2026.</div>
          <div className="sub-quote">The road to 21.1km starts here.</div>
        </div>
        
        <div className="hero-actions">
          <a href="/login" className="hero-btn primary">Open My Dashboard →</a>
          <a href="#members" className="hero-btn secondary">View The Crew</a>
        </div>

        <div className="hero-stat-pills">
          <span className="stat-pill">15 Runners</span>
          <span className="stat-pill">10 Weeks</span>
          <span className="stat-pill">3 Plans</span>
          <span className="stat-pill">1 Finish Line</span>
        </div>

        <div className="hero-countdown-section">
          <div className="cd-label">⏱ RACE DAY COUNTDOWN</div>
          <div className="cd-boxes">
            <div className="cd-box"><span className="cd-num">{timeLeft.d}</span><span className="cd-box-lbl">DAYS</span></div>
            <div className="cd-sep">:</div>
            <div className="cd-box"><span className="cd-num">{timeLeft.h}</span><span className="cd-box-lbl">HOURS</span></div>
            <div className="cd-sep">:</div>
            <div className="cd-box"><span className="cd-num">{timeLeft.m}</span><span className="cd-box-lbl">MINS</span></div>
            <div className="cd-sep">:</div>
            <div className="cd-box"><span className="cd-num">{timeLeft.s}</span><span className="cd-box-lbl">SECS</span></div>
          </div>
          <div className="cd-toggles">
            <button 
              className={`toggle-pill ${targetName === 'joyville' ? 'active' : ''}`}
              onClick={() => setTargetName('joyville')}
            >
              Joyville · Aug 23
            </button>
            <button 
              className={`toggle-pill ${targetName === 'tuffman' ? 'active' : ''}`}
              onClick={() => setTargetName('tuffman')}
            >
              Tuffman · Aug 2026
            </button>
          </div>
        </div>
      </div>

      <div className={`hero-scroll-indicator ${scrolled ? 'hidden' : ''}`}>
        <div className="scroll-text">SCROLL</div>
        <div className="scroll-arrow">↓</div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hero-section {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding-top: 80px; /* offset for navbar/ticker */
        }
        
        /* BACKGROUNDS */
        .hero-bg-base {
          position: absolute; inset: 0; z-index: 1;
          background-color: #080f1a;
        }
        
        .hero-track-container {
          position: absolute; inset: 0; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          opacity: 0.12;
        }
        .hero-track {
          width: 200vw; height: 200vw;
          max-width: 1500px; max-height: 1500px;
          animation: spin 60s linear infinite;
        }
        
        .hero-bg-overlay {
          position: absolute; inset: 0; z-index: 3;
          background: radial-gradient(ellipse at center, #0f2a4a 0%, #080f1a 70%);
          mix-blend-mode: normal;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* CONTENT */
        .hero-content {
          position: relative; z-index: 10;
          width: 100%; max-width: 680px;
          margin-left: 10vw;
        }
        
        .hero-eyebrow {
          font-family: monospace; font-size: 11px;
          color: #3b82f6; letter-spacing: 0.2em;
          margin-bottom: 24px;
        }
        
        .hero-headline {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(5rem, 12vw, 10rem);
          line-height: 0.95; letter-spacing: 0.04em;
          margin-bottom: 32px; font-weight: normal;
          text-shadow: none;
        }
        .hl-line1 { color: #ffffff; }
        .hl-line2 { color: #3b82f6; }
        
        .hero-subheadline-block {
          margin-bottom: 32px;
        }
        .sub-label {
          font-size: 14px; color: #94a3b8;
          letter-spacing: 0.05em; margin-bottom: 12px;
        }
        .sub-quote {
          border-left: 3px solid #3b82f6;
          padding-left: 16px; font-style: italic;
          font-size: 18px; color: #e2e8f0;
          line-height: 1.5; display: inline-block;
        }
        
        .hero-actions {
          display: flex; gap: 12px; margin-bottom: 16px;
        }
        .hero-btn {
          height: 48px; padding: 0 28px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 6px; font-size: 14px; font-weight: bold;
          text-decoration: none; transition: all 0.2s ease;
          cursor: pointer; font-family: inherit;
        }
        .hero-btn.primary {
          background: #3b82f6; color: white; border: none;
        }
        .hero-btn.primary:hover {
          background: #2563eb; transform: translateY(-2px);
          box-shadow: 0 8px 24px #3b82f640;
        }
        .hero-btn.secondary {
          background: transparent; border: 1px solid #3b82f6;
          color: #3b82f6;
        }
        .hero-btn.secondary:hover {
          background: #3b82f610;
        }
        
        .hero-stat-pills {
          display: flex; gap: 8px; flex-wrap: wrap;
        }
        .stat-pill {
          background: #0f1c2e; border: 1px solid #1e3a5f;
          border-radius: 99px; font-size: 12px; color: #94a3b8;
          letter-spacing: 0.05em; padding: 6px 14px;
        }
        
        /* COUNTDOWN */
        .hero-countdown-section {
          margin-top: 32px;
        }
        .cd-label {
          font-family: monospace; font-size: 10px;
          color: #3b82f6; letter-spacing: 0.2em;
          margin-bottom: 12px;
        }
        .cd-boxes {
          display: flex; gap: 8px; align-items: center;
          margin-bottom: 16px;
        }
        .cd-box {
          background: #0f1c2e; border: 1px solid #1e3a5f;
          border-radius: 8px; padding: 16px 20px;
          min-width: 72px; text-align: center;
        }
        .cd-num {
          font-family: 'Bebas Neue', sans-serif; font-size: 3rem;
          color: #f0f4f8; text-shadow: 0 0 20px #3b82f660;
          display: block; line-height: 1;
        }
        .cd-box-lbl {
          font-size: 9px; color: #64748b; letter-spacing: 0.15em;
          text-transform: uppercase; margin-top: 4px; display: block;
        }
        .cd-sep {
          color: #3b82f6; font-size: 2rem; font-family: 'Bebas Neue', sans-serif;
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .cd-toggles {
          display: flex; gap: 8px;
        }
        .toggle-pill {
          padding: 6px 14px; border-radius: 99px;
          font-size: 11px; cursor: pointer; transition: all 0.2s ease;
          background: transparent;
        }
        .toggle-pill.active {
          background: #3b82f620; border: 1px solid #3b82f6; color: #3b82f6;
        }
        .toggle-pill:not(.active) {
          border: 1px solid #1e3a5f; color: #64748b;
        }
        
        /* SCROLL INDICATOR */
        .hero-scroll-indicator {
          position: absolute; bottom: 24px; left: 50%;
          transform: translateX(-50%); z-index: 10;
          text-align: center; transition: opacity 0.3s ease;
        }
        .hero-scroll-indicator.hidden {
          opacity: 0; pointer-events: none;
        }
        .scroll-text {
          font-size: 9px; color: #475569; letter-spacing: 0.3em;
        }
        .scroll-arrow {
          font-size: 14px; color: #3b82f6; margin-top: 4px;
          animation: bounce 2s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        
        /* MOBILE */
        @media (max-width: 768px) {
          .hero-content {
            margin-left: 0; padding: 0 24px;
            text-align: center; display: flex; flex-direction: column; align-items: center;
          }
          .hero-headline {
            font-size: clamp(3rem, 10vw, 5rem);
          }
          .sub-quote {
            text-align: left; /* Keep quote styling intact */
          }
          .hero-actions {
            flex-direction: column; width: 100%;
          }
          .hero-btn { width: 100%; }
          .cd-boxes { justify-content: center; }
          .cd-toggles { justify-content: center; }
          .hero-stat-pills { justify-content: center; }
        }
      `}} />
    </div>
  )
}

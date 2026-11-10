"use client"

import React, { useState, useEffect } from 'react'

export default function Footer() {
  const messages = [
    "To run FAST, you must run SLOW.",
    "Small achievable goals add up to huge milestones.",
    "Every runner belongs here. Connect Strava and enjoy the miles.",
    "Consistency over perfection, always."
  ]
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx(i => (i + 1) % messages.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [messages.length])

  return (
    <footer style={{
      background: '#FFFFFF',
      borderTop: '1px solid #E2E8F0',
      padding: '48px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
          RUNCLUB
        </span>
        <span style={{
          background: 'rgba(252,76,2,0.1)',
          color: '#FC4C02',
          fontSize: '10px',
          fontFamily: 'monospace',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '12px'
        }}>
          POWERED BY STRAVA
        </span>
      </div>

      <div style={{ fontSize: '14px', color: '#64748B', maxWidth: '480px', lineHeight: 1.5 }}>
        An open running community where anyone can track progress, hit micro-goals, and celebrate every mile.
      </div>

      <div style={{
        marginTop: '8px',
        padding: '8px 18px',
        background: '#FFF7ED',
        border: '1px solid #FFEDD5',
        borderRadius: '20px',
        color: '#C2410C',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'monospace'
      }}>
        ✨ &ldquo;{messages[msgIdx]}&rdquo;
      </div>

      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '16px' }}>
        © {new Date().getFullYear()} RunClub · Joyville Road Runners · Free for every runner
      </div>
    </footer>
  )
}

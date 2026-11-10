"use client"

import React from 'react'

export default function InclusiveSection() {
  const cards = [
    {
      icon: '🌱',
      title: 'Beginners Welcome',
      desc: 'Whether your run is 1 km or 20 minutes with walk breaks, you are a runner. Every single step counts.'
    },
    {
      icon: '😊',
      title: 'No Race Required',
      desc: 'You do not need an event bib, a marathon registration, or a medal. Running for mental clarity and health is the purest goal.'
    },
    {
      icon: '🐢',
      title: 'The Slow Run Superpower',
      desc: 'To run FAST, you must run SLOW. 80% of elite runners’ volume is conversational. Slow down and build your aerobic engine.'
    },
    {
      icon: '🔥',
      title: 'Zero Intimidation, Pure Support',
      desc: 'Connect your Strava, collect hypes from the community, and celebrate showing up week after week.'
    }
  ]

  return (
    <div style={{
      background: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: '24px',
      padding: '48px 36px',
      marginTop: '60px',
      marginBottom: '60px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px auto' }}>
        <span style={{
          background: 'rgba(2,132,199,0.1)',
          color: '#0284C7',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 700,
          padding: '4px 12px',
          borderRadius: '20px',
          letterSpacing: '1px'
        }}>
          A COMMUNITY FOR EVERY PACE
        </span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#0F172A', marginTop: '12px', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Training for a race or just running for you? You belong here.
        </h2>
        <p style={{ color: '#64748B', fontSize: '15px', lineHeight: 1.6 }}>
          RunClub is built on one simple belief: running should be joyful, accessible, and free of pressure.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        {cards.map((c, idx) => (
          <div
            key={idx}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{c.icon}</div>
            <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              {c.title}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
              {c.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

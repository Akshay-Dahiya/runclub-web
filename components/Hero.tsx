"use client"

import React, { useState, useEffect } from 'react'

interface HeroProps {
  thisWeekKm?: number
  activeRunnersCount?: number
}

export default function Hero({ thisWeekKm = 142, activeRunnersCount = 16 }: HeroProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{
      position: 'relative',
      minHeight: '92vh',
      width: '100%',
      background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 60%, #FFF7ED 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '120px 24px 80px',
      overflow: 'hidden'
    }}>
      {/* Subtle Warm Background Glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(252,76,2,0.08) 0%, rgba(2,132,199,0.04) 50%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Live Community Mileage Ticker Pill */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '30px',
        padding: '8px 20px',
        marginBottom: '28px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        animation: 'fadeSlideUp 0.4s ease both'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#16A34A',
          boxShadow: '0 0 0 3px rgba(34,197,94,0.2)'
        }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
          🔥 <strong>{Math.round(thisWeekKm)} KM</strong> logged by the community this week
        </span>
        <span style={{ fontSize: '12px', color: '#64748B' }}>
          · {activeRunnersCount} active runners
        </span>
      </div>

      {/* Main Tagline Headline */}
      <div style={{ maxWidth: '920px', margin: '0 auto', marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'clamp(2.8rem, 7.5vw, 6rem)',
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          color: '#0F172A',
          margin: 0
        }}>
          To run <span style={{ color: '#FC4C02' }}>FAST</span>,<br />
          you must run <span style={{
            background: 'linear-gradient(135deg, #0284C7 0%, #16A34A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>SLOW</span>.
        </h1>
      </div>

      {/* Subheadline */}
      <p style={{
        fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
        color: '#475569',
        maxWidth: '680px',
        lineHeight: 1.6,
        margin: '0 auto 36px auto',
        fontWeight: 400
      }}>
        Connect Strava, follow your runs, and share stories with the group. <strong>No event needed.</strong>
      </p>

      {/* Big Orange 1-Click Strava Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <a
          href="/api/strava"
          style={{
            background: '#FC4C02',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '1.25rem',
            fontWeight: 800,
            padding: '18px 42px',
            borderRadius: '50px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 30px rgba(252,76,2,0.35)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(252,76,2,0.45)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(252,76,2,0.35)'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.926 15.688h4.172"/>
          </svg>
          <span>Connect with Strava</span>
          <span style={{ fontSize: '1.2rem' }}>→</span>
        </a>

        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748B', fontWeight: 600 }}>
          Takes 10 seconds · Free for every runner · No download required
        </div>
      </div>

      {/* Quick Community Feature Badges */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        fontSize: '13px',
        color: '#334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', padding: '8px 16px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span>📊</span> Weekly Mileage Charts
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', padding: '8px 16px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span aria-hidden="true" style={{ color: '#FC4C02', fontSize: '11px', fontWeight: 900 }}>ST</span> Club Stories
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', padding: '8px 16px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span>🐢</span> Zero Pace Shaming
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', padding: '8px 16px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span>🔥</span> Community High-Fives
        </div>
      </div>
    </div>
  )
}

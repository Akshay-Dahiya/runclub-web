"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: scrolled ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #E2E8F0',
      transition: 'all 0.2s ease',
      boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.04)' : 'none'
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none'
        }}>
          <Image
            src="/logo.png?v=3"
            alt="RunClub Logo"
            width={40}
            height={40}
            style={{ height: '40px', width: 'auto', borderRadius: '8px' }}
          />
          <div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              RUNCLUB
            </div>
            <div style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#FC4C02',
              fontWeight: 700,
              letterSpacing: '1px',
              marginTop: '2px'
            }}>
              JOYVILLE ROAD RUNNERS
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="desktop-nav">
          <Link href="/dashboard" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            Dashboard
          </Link>
          <Link href="/#goals" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            Goals
          </Link>
          <Link href="/#feed" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            Feed
          </Link>
          <Link href="/#leaderboard" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            Leaderboard
          </Link>
          <Link href="/login" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
            Join with Strava
          </Link>
          <Link href="/signup" style={{
            background: '#FC4C02',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 700,
            padding: '10px 20px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 14px rgba(252,76,2,0.25)',
          }}>
            Connect Strava
          </Link>
        </nav>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mobile-toggle"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#0F172A',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Link href="/#goals" onClick={() => setIsOpen(false)} style={{ color: '#0F172A', textDecoration: 'none', fontSize: '16px', fontWeight: 600 }}>
            Goals
          </Link>
          <Link href="/#feed" onClick={() => setIsOpen(false)} style={{ color: '#0F172A', textDecoration: 'none', fontSize: '16px', fontWeight: 600 }}>
            Activity Feed
          </Link>
          <Link href="/#leaderboard" onClick={() => setIsOpen(false)} style={{ color: '#0F172A', textDecoration: 'none', fontSize: '16px', fontWeight: 600 }}>
            Leaderboard
          </Link>
          <Link href="/login" onClick={() => setIsOpen(false)} style={{ color: '#0F172A', textDecoration: 'none', fontSize: '16px', fontWeight: 600 }}>
            Join with Strava
          </Link>
          <Link href="/signup" onClick={() => setIsOpen(false)} style={{
            background: '#FC4C02',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 700,
            padding: '12px 20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            Connect Strava
          </Link>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          :global(.desktop-nav) {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-toggle {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}

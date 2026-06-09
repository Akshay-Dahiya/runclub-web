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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
      {/* TOP TICKER BAR */}
      <div style={{
        background: '#04090f',
        height: '32px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap'
      }}>
        <div className="ticker-content" style={{
          display: 'inline-block',
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#3b82f6',
          paddingLeft: '100%',
          animation: 'ticker 20s linear infinite'
        }}>
          ▶ JOYVILLE ROAD RUNNERS · AUG 23, 2026 · DELHI · 10K & 21.1K · TUFFMAN AUG 2026 · 15 RUNNERS TRAINING ·
        </div>
      </div>

      <nav style={{ 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 48px',
        background: scrolled ? 'rgba(8, 15, 26, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #1e3a5f' : '1px solid transparent',
        transition: 'all 0.3s ease'
      }}>
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

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .nav-links a { transition: color 0.2s; }
        .nav-links a:hover { color: #3b82f6 !important; }
      `}} />
    </div>
  )
}

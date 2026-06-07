"use client"

import React, { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav>
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
        <li><Link href="/#dashboard" onClick={() => setIsOpen(false)} style={{ color: 'var(--orange)', fontWeight: 'bold' }}>My Dashboard</Link></li>
        <li>
          <Link href="/login" onClick={() => setIsOpen(false)} style={{
            background: 'var(--orange)', color: '#000', padding: '8px 18px',
            borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem'
          }}>
            Login
          </Link>
        </li>
      </ul>
    </nav>
  )
}

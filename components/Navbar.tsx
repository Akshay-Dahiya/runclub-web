"use client"

import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <nav>
      <Link href="/" className="nav-logo">RUNCLUB</Link>
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
        {session ? (
          <>
            <li><Link href="/dashboard" onClick={() => setIsOpen(false)} style={{ color: 'var(--green)', fontWeight: 'bold' }}>Dashboard</Link></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); signOut(); setIsOpen(false); }}>Logout</a></li>
          </>
        ) : (
          <li><Link href="/login" onClick={() => setIsOpen(false)} style={{ color: 'var(--orange)', fontWeight: 'bold' }}>Login</Link></li>
        )}
      </ul>
    </nav>
  )
}

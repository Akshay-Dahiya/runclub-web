"use client"

import React, { useState } from 'react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav>
      <a className="nav-logo" href="#">RUNCLUB</a>
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
      </button>
      <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
        <li><a href="#members" onClick={() => setIsOpen(false)}>Members</a></li>
        <li><a href="#plans" onClick={() => setIsOpen(false)}>Training Plans</a></li>
        <li><a href="#calendar" onClick={() => setIsOpen(false)}>Calendar</a></li>
        <li><a href="#leaderboard" onClick={() => setIsOpen(false)}>Leaderboard</a></li>
        <li><a href="#log" onClick={() => setIsOpen(false)}>Log Run</a></li>
      </ul>
    </nav>
  )
}

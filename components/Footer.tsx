"use client"

import React, { useState, useEffect } from 'react'
import { PARTICIPANTS } from '../lib/planData'

export default function Footer() {
  const hmCount = PARTICIPANTS.filter(p => p.cat.startsWith('HM')).length
  const tenKCount = PARTICIPANTS.filter(p => p.cat === '10K').length
  const total = PARTICIPANTS.length

  const messages = [
    "Built for Joyville Road Runners.",
    "Nothing changes if nothing changes.",
    "See you at the starting line."
  ]
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx(i => (i + 1) % messages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <footer>
      <span className="footer-logo">JOYVILLE ROAD RUNNERS</span>
      <span className="footer-text">AUG 23, 2026 · DELHI · 10K & 21.1K</span>
      <span className="footer-text">{hmCount} HM · {tenKCount} × 10K · {total} RUNNERS · 1 FINISH LINE</span>
      <span className="footer-text" style={{ fontStyle: 'italic', opacity: 0.8, color: 'var(--accent)' }}>
        {messages[msgIdx]}
      </span>
    </footer>
  )
}

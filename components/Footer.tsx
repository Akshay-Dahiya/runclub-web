import React from 'react'
import { PARTICIPANTS } from '../lib/planData'

export default function Footer() {
  const hmCount = PARTICIPANTS.filter(p => p.cat.startsWith('HM')).length
  const tenKCount = PARTICIPANTS.filter(p => p.cat === '10K').length
  const total = PARTICIPANTS.length

  return (
    <footer>
      <span className="footer-logo">JOYVILLE ROAD RUNNERS</span>
      <span className="footer-text">AUG 23, 2026 · DELHI · 10K & 21.1K</span>
      <span className="footer-text">{hmCount} HM · {tenKCount} × 10K · {total} RUNNERS · 1 FINISH LINE</span>
    </footer>
  )
}

'use client'
import React, { useState } from 'react'

export default function RunForm({ onSaved }:{ onSaved?:()=>void }) {
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')

  async function save() {
    const distanceKm = parseFloat(distance)
    const durationSec = Math.round(parseFloat(duration) * 60)
    const paceSecPerKm = Math.round(durationSec / distanceKm)
    await fetch('/api/runs', { method: 'POST', body: JSON.stringify({ distanceKm, durationSec, paceSecPerKm, date: new Date() }), headers: { 'Content-Type': 'application/json' } })
    setDistance('')
    setDuration('')
    onSaved?.()
  }

  return (
    <div className="p-3 border rounded space-y-2">
      <input value={distance} onChange={e=>setDistance(e.target.value)} placeholder="Distance (km)" className="w-full p-2 border rounded" />
      <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Duration (minutes)" className="w-full p-2 border rounded" />
      <button onClick={save} className="px-3 py-2 bg-blue-600 text-white rounded">Save Run</button>
    </div>
  )
}
